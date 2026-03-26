import type { Language, SubmissionState } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { genPassword } from '../../teams/util';
import { normalizeNewlines } from '$lib/common/output-analyzer/analyzer-utils';
import { analyzeSubmissionOutput } from '$lib/common/output-analyzer/output-analyzer';
import z from 'zod';
import { checkboxSchema, stringToJsonSchema } from '$lib/common/utils';

export const load: PageServerLoad = async () => {};

const problemImportDataSchema = z.object({
	ProblemName: z.string(),
	ShortName: z.string(),
	SampleInput: z.string(),
	SampleOutput: z.string(),
	RealInput: z.string(),
	RealOutput: z.string(),
	InputSpec: z.string().optional()
});
export type ProblemImportData = z.infer<typeof problemImportDataSchema>;

const teamImportDataSchema = z.object({ TeamName: z.string() });
export type TeamImportData = z.infer<typeof teamImportDataSchema>;

const submissionImportDataSchema = z.object({
	TeamName: z.string(),
	ProblemShortName: z.string(),
	State: z.string(),
	SubmitTime: z.number(),
	TeamOutput: z.string(),
	Code: z.string().nullable(),
	Language: z.enum(['Java', 'C#', 'C++', 'Python']).nullable()
});
export type SubmissionImportData = z.infer<typeof submissionImportDataSchema>;

const contestImportDataSchema = z.object({
	Name: z.string(),
	Problems: z.array(problemImportDataSchema),
	Teams: z.array(teamImportDataSchema),
	Submissions: z.array(submissionImportDataSchema)
});
export type ContestImportData = z.infer<typeof contestImportDataSchema>;

const defaultSchema = z.object({
	jsonText: stringToJsonSchema.pipe(contestImportDataSchema),
	includeSubmissions: checkboxSchema,
	createReposAndKeepContestRunning: checkboxSchema
});

export const actions = {
	default: async ({ request }) => {
		const form = defaultSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return fail(400, { message: `Invalid form data: ${form.error}` });
		}

		try {
			let contestStart: Date | null = null;
			let hasSubmissions = false;

			if (form.data.includeSubmissions && form.data.jsonText.Submissions.length > 0) {
				hasSubmissions = true;

				const maxSubmitTimeMinutes = Math.max(
					...form.data.jsonText.Submissions.map((s) => s.SubmitTime)
				);
				const now = new Date();
				contestStart = new Date(now.getTime() - maxSubmitTimeMinutes * 60 * 1000);
			}

			// Single transaction
			const contest = await db.contest.create({
				data: {
					name: parsedContest.Name,
					startTime: contestStart,
					teams: {
						connectOrCreate: parsedContest.Teams.map((team) => ({
							where: { name: team.TeamName },
							create: {
								name: team.TeamName,
								password: genPassword(),
								language: inferTeamLanguage(parsedContest, team) ?? 'Java'
							}
						}))
					},
					problems: {
						connectOrCreate: parsedContest.Problems.map((problem) => ({
							where: {
								friendlyName: problem.ProblemName,
								pascalName: problem.ShortName,
								sampleInput: normalizeNewlines(problem.SampleInput),
								sampleOutput: normalizeNewlines(problem.SampleOutput),
								realInput: normalizeNewlines(problem.RealInput),
								realOutput: normalizeNewlines(problem.RealOutput)
							},
							create: {
								friendlyName: problem.ProblemName,
								pascalName: problem.ShortName,
								sampleInput: normalizeNewlines(problem.SampleInput),
								sampleOutput: normalizeNewlines(problem.SampleOutput),
								realInput: normalizeNewlines(problem.RealInput),
								realOutput: normalizeNewlines(problem.RealOutput)
							}
						}))
					},
					submissions: {
						create: hasSubmissions
							? parsedContest.Submissions.toSorted((a, b) => a.SubmitTime - b.SubmitTime).map(
									(submission) =>
										(() => {
											if (contestStart === null) {
												throw new Error("contestStart is null when it shouldn't");
											}
											return {
												createdAt: dateFromContestMinutes(contestStart, submission.SubmitTime),
												gradedAt: dateFromContestMinutes(contestStart, submission.SubmitTime + 1),
												state: convertSubmissionState(submission),
												actualOutput: submission.TeamOutput,
												commitHash: '',
												problem: {
													connect: {
														pascalName: submission.ProblemShortName
													}
												},
												team: {
													connect: {
														name: submission.TeamName
													}
												},
												sourceFiles:
													submission.Code !== null
														? {
																create: {
																	pathFromProblemRoot: 'importedCode.txt',
																	content: submission.Code
																}
															}
														: {}
											};
										})()
								)
							: []
					}
				}
			});

			const contestWithProblems = await db.contest.findUnique({
				where: { id: contest.id },
				include: { problems: true }
			});
			for (const problem of contestWithProblems?.problems ?? []) {
				const importedInputSpec = form.data.jsonText.Problems.find(
					(p) => p.ShortName === problem.pascalName
				)?.InputSpec;
				if (importedInputSpec !== undefined) {
					await db.problem.update({
						where: { id: problem.id },
						data: { inputSpec: importedInputSpec }
					});
				}
			}

			if (form.data.includeSubmissions) {
				const insertedSubmissions = await db.submission.findMany({
					where: { contestId: contest.id },
					include: { problem: true }
				});
				for (const insertedSubmission of insertedSubmissions) {
					if (insertedSubmission.actualOutput === null) {
						continue;
					}

					const testCaseResultString =
						analyzeSubmissionOutput(insertedSubmission.problem, insertedSubmission.actualOutput)
							?.databaseString ?? 'Unknown';
					await db.submission.update({
						where: { id: insertedSubmission.id },
						data: { testCaseResults: testCaseResultString }
					});
				}
			}

			if (form.data.createReposAndKeepContestRunning) {
				const fullContest = await db.contest.findUnique({
					where: { id: contest.id },
					include: { teams: { include: { activeTeam: true } } }
				});

				if (
					fullContest &&
					form.data.jsonText.Problems.length > 0 &&
					form.data.jsonText.Teams.length > 0
				) {
					if (!fullContest.startTime) {
						await db.contest.update({
							where: { id: fullContest.id },
							data: {
								startTime: new Date()
							}
						});
					}

					fullContest.teams.forEach(async (team) => {
						await db.activeTeam.create({ data: { teamId: team.id, contestId: contest.id } });
					});

					await createRepos({ contestId: contest.id, teamIds: fullContest.teams.map((t) => t.id) });
				}
			}
		} catch (err) {
			return fail(400, { message: 'Error updating database: ' + err?.toString() });
		}

		return redirect(303, '/admin/contests');
	}
} satisfies Actions;

function convertSubmissionState(submission: SubmissionImportData): SubmissionState {
	switch (submission.State) {
		case 'Correct':
			return 'Correct';
		case 'Incorrect':
			return 'Incorrect';
		default:
			return 'InReview';
	}
}

function inferTeamLanguage(
	parsedContest: ContestImportData,
	team: TeamImportData
): Language | null {
	const submissionWithCode = parsedContest.Submissions.find(
		(s) => s.TeamName === team.TeamName && s.Code !== null
	);
	if (!submissionWithCode) {
		return null;
	}

	switch (submissionWithCode.Language) {
		case 'Java':
			return 'Java';
		case 'C#':
			return 'CSharp';
		case 'C++':
			return 'CPP';
		case 'Python':
			return 'Python';
		default:
			throw new Error('Unrecognized language: ' + submissionWithCode.Language);
	}
}

function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}
