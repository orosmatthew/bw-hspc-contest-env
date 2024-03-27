import { db } from '$lib/server/prisma';
import type { Language, SubmissionState } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { genPassword } from '../../teams/util';
import { createRepos } from '$lib/server/repos';
import { analyzeSubmissionOutput } from '$lib/outputAnalyzer/outputAnalyzer';
import { normalizeNewlines } from '$lib/outputAnalyzer/analyzerUtils';

export const load = (async () => {}) satisfies PageServerLoad;

export type ContestImportData = {
	Name: string;
	Problems: ProblemImportData[];
	Teams: TeamImportData[];
	Submissions: SubmissionImportData[];
};

export type ProblemImportData = {
	ProblemName: string;
	ShortName: string;
	SampleInput: string;
	SampleOutput: string;
	RealInput: string;
	RealOutput: string;
	InputSpec?: string;
};

export type TeamImportData = {
	TeamName: string;
};

export type SubmissionImportData = {
	TeamName: string;
	ProblemShortName: string;
	State: string;
	SubmitTime: number;
	TeamOutput: string;
	Code: string | null;
	Language: 'Java' | 'C#' | 'C++' | null;
};

export const actions = {
	default: async ({ request }) => {
		let parsedContest: ContestImportData;
		let includeSubmissions: boolean;
		let createReposAndKeepContestRunning: boolean;

		try {
			const formData = await request.formData();
			const contestJson = formData.get('jsonText')?.toString();
			if (!contestJson) {
				return fail(400, { message: 'Could not get json text' });
			}

			parsedContest = JSON.parse(contestJson);
			includeSubmissions = formData.get('includeSubmissions')?.toString() == 'on';
			createReposAndKeepContestRunning =
				formData.get('createReposAndKeepContestRunning')?.toString() == 'on';
		} catch (err) {
			return fail(400, { message: 'Could not parse contest data: ' + err?.toString() });
		}

		try {
			let contestStart: Date | null = null;
			let hasSubmissions = false;

			if (includeSubmissions && parsedContest.Submissions.length > 0) {
				hasSubmissions = true;

				const maxSubmitTimeMinutes = Math.max(
					...parsedContest.Submissions.map((s) => s.SubmitTime)
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
									(submission) => ({
										createdAt: dateFromContestMinutes(contestStart!, submission.SubmitTime),
										gradedAt: dateFromContestMinutes(contestStart!, submission.SubmitTime + 1),
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
										sourceFiles: submission.Code
											? {
													create: {
														pathFromProblemRoot: 'importedCode.txt',
														content: submission.Code
													}
												}
											: {}
									})
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
				const importedInputSpec = parsedContest.Problems.find(
					(p) => p.ShortName == problem.pascalName
				)?.InputSpec;
				if (importedInputSpec) {
					await db.problem.update({
						where: { id: problem.id },
						data: { inputSpec: importedInputSpec }
					});
				}
			}

			if (includeSubmissions) {
				const insertedSubmissions = await db.submission.findMany({
					where: { contestId: contest.id },
					include: { problem: true }
				});
				for (const insertedSubmission of insertedSubmissions) {
					if (!insertedSubmission.actualOutput) {
						continue;
					}

					const testCaseResultString = analyzeSubmissionOutput(
						insertedSubmission.problem,
						insertedSubmission.actualOutput
					).databaseString;
					await db.submission.update({
						where: { id: insertedSubmission.id },
						data: { testCaseResults: testCaseResultString }
					});
				}
			}

			if (createReposAndKeepContestRunning) {
				const fullContest = await db.contest.findUnique({
					where: { id: contest.id },
					include: { teams: { include: { activeTeam: true } } }
				});

				if (fullContest && parsedContest.Problems.length > 0 && parsedContest.Teams.length > 0) {
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

					await createRepos(
						contest.id,
						fullContest.teams.map((t) => t.id)
					);
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
		(s) => s.TeamName == team.TeamName && s.Code != null
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
		default:
			throw new Error('Unrecognized language: ' + submissionWithCode.Language);
	}
}

function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}
