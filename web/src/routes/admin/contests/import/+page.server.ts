import type { PageServerLoad } from './$types';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { normalizeNewlines } from '$lib/common/output-analyzer/analyzer-utils';
import { analyzeSubmissionOutput } from '$lib/common/output-analyzer/output-analyzer';
import z from 'zod';
import { checkboxSchema, genTeamPassword, stringToJsonSchema } from '$lib/common/utils';
import { createRepos } from '$lib/server/git-repos';
import {
	activeTeamRepo,
	contestRepo,
	problemRepo,
	submissionRepo,
	submissionSourceFileRepo,
	teamRepo
} from '$lib/server/repos';
import type { TeamLanguage } from '$lib/server/repos/team-repo';
import type { SubmissionState } from '$lib/server/repos/submission-repo';

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

export const actions: Actions = {
	default: async ({ request }) => {
		const form = defaultSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return fail(400, { message: `Invalid form data: ${form.error}` });
		}

		let contestStart: Date | null = null;
		if (form.data.includeSubmissions && form.data.jsonText.Submissions.length > 0) {
			const maxSubmitTimeMinutes = Math.max(
				...form.data.jsonText.Submissions.map((s) => s.SubmitTime)
			);
			const now = new Date();
			contestStart = new Date(now.getTime() - maxSubmitTimeMinutes * 60 * 1000);
		}

		const contestId = await contestRepo.create({
			name: form.data.jsonText.Name,
			startTime: contestStart,
			freezeTime: null
		});
		if (contestId === undefined) {
			return fail(500, { message: 'Unable to create contest' });
		}

		const teamIds: Array<number> = [];
		for (const team of form.data.jsonText.Teams) {
			const existing = await teamRepo.getByNamePrivate(team.TeamName);
			if (existing !== undefined) {
				teamIds.push(existing.id);
			} else {
				const id = await teamRepo.create({
					name: team.TeamName,
					password: genTeamPassword(),
					language: inferTeamLanguage(form.data.jsonText, team) ?? 'java'
				});
				if (id === undefined) {
					return fail(500, { message: `Unable to create team: ${team.TeamName}` });
				}
				teamIds.push(id);
			}
		}
		const assignTeamsSuccess = await contestRepo.assignTeamIds(contestId, teamIds);
		if (assignTeamsSuccess !== true) {
			return fail(500, { message: 'Unable to assign teams to contest' });
		}

		const problemIds: Array<number> = [];
		for (const problem of form.data.jsonText.Problems) {
			const existing = await problemRepo.getByPascalNamePrivate(problem.ShortName);
			if (existing !== undefined) {
				problemIds.push(existing.id);
			} else {
				const id = await problemRepo.create({
					friendlyName: problem.ProblemName,
					pascalName: problem.ShortName,
					sampleInput: normalizeNewlines(problem.SampleInput),
					sampleOutput: normalizeNewlines(problem.SampleOutput),
					realInput: normalizeNewlines(problem.RealInput),
					realOutput: normalizeNewlines(problem.RealOutput),
					inputSpec: null
				});
				if (id === undefined) {
					return fail(500, { message: `Unable to create problem: ${problem.ProblemName}` });
				}
				problemIds.push(id);
			}
		}
		const assignProblemsSuccess = await contestRepo.assignProblemIds(contestId, problemIds);
		if (assignProblemsSuccess !== true) {
			return fail(500, { message: 'Unable to assign problems to contest' });
		}

		const sortedSubmissions = form.data.jsonText.Submissions.toSorted(
			(a, b) => a.SubmitTime - b.SubmitTime
		);
		for (const submission of sortedSubmissions) {
			if (contestStart === null) {
				return fail(500, { message: 'contestStart is unexpectedly null' });
			}
			const problem = await problemRepo.getByPascalNamePrivate(submission.ProblemShortName);
			if (problem === undefined) {
				return fail(500, {
					message: `Problem not found for submission: ${submission.ProblemShortName}`
				});
			}
			const team = await teamRepo.getByNamePrivate(submission.TeamName);
			if (team === undefined) {
				return fail(500, { message: `Team not found for submission: ${submission.TeamName}` });
			}
			const submissionId = await submissionRepo.create({
				createdAt: dateFromContestMinutes(contestStart, submission.SubmitTime),
				gradedAt: dateFromContestMinutes(contestStart, submission.SubmitTime + 1),
				state: convertSubmissionState(submission),
				stateReason: null,
				stateReasonDetails: null,
				actualOutput: submission.TeamOutput,
				testCaseResults: null,
				exitCode: null,
				runtimeMilliseconds: null,
				commitHash: '',
				diff: null,
				message: null,
				teamId: team.id,
				problemId: problem.id,
				contestId: contestId
			});
			if (submissionId === undefined) {
				return fail(500, { message: 'Unable to create a submission' });
			}
			if (submission.Code !== null) {
				const submissionSourceFileId = await submissionSourceFileRepo.create({
					submissionId: submissionId,
					pathFromRootProblem: 'importedCode.txt',
					content: submission.Code
				});
				if (submissionSourceFileId === undefined) {
					return fail(500, { message: 'Unable to create a submission source file' });
				}
			}
		}

		const contestProblems = await problemRepo.getInContestPrivate(contestId);
		for (const problem of contestProblems) {
			const importedInputSpec = form.data.jsonText.Problems.find(
				(p) => p.ShortName === problem.pascalName
			)?.InputSpec;
			if (importedInputSpec !== undefined) {
				await problemRepo.update(problem.id, { inputSpec: importedInputSpec });
			}
		}

		if (form.data.includeSubmissions) {
			const insertedSubmissions = await submissionRepo.getInContest(contestId);
			for (const insertedSubmission of insertedSubmissions) {
				if (insertedSubmission.actualOutput === null) {
					continue;
				}
				const problem = await problemRepo.getByIdPrivate(insertedSubmission.problemId);
				if (problem === undefined) {
					continue;
				}
				const testCaseResultString =
					analyzeSubmissionOutput(problem, insertedSubmission.actualOutput)?.databaseString ??
					'Unknown';
				await submissionRepo.update(insertedSubmission.id, {
					testCaseResults: testCaseResultString
				});
			}
		}

		if (form.data.createReposAndKeepContestRunning) {
			const contest = await contestRepo.getById(contestId);
			if (
				contest !== undefined &&
				form.data.jsonText.Problems.length > 0 &&
				form.data.jsonText.Teams.length > 0
			) {
				if (contest.startTime !== null) {
					await contestRepo.updateStartTime(contest.id, new Date());
				}
				const teams = await teamRepo.getInContestPrivate(contest.id);
				await activeTeamRepo.createMany(
					teams.map((t) => ({ contestId: contest.id, teamId: t.id }))
				);
				await createRepos({ contestId: contest.id, teamIds: teams.map((t) => t.id) });
			}
			return redirect(303, '/admin/contests');
		}
	}
};

function convertSubmissionState(submission: SubmissionImportData): SubmissionState {
	switch (submission.State) {
		case 'Correct':
			return 'correct';
		case 'Incorrect':
			return 'incorrect';
		default:
			return 'in_review';
	}
}

function inferTeamLanguage(
	parsedContest: ContestImportData,
	team: TeamImportData
): TeamLanguage | null {
	const submissionWithCode = parsedContest.Submissions.find(
		(s) => s.TeamName === team.TeamName && s.Code !== null
	);
	if (!submissionWithCode) {
		return null;
	}

	switch (submissionWithCode.Language) {
		case 'Java':
			return 'java';
		case 'C#':
			return 'csharp';
		case 'C++':
			return 'cpp';
		case 'Python':
			return 'python';
		default:
			throw new Error('Unrecognized language: ' + submissionWithCode.Language);
	}
}

function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}
