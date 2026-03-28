import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';
import { analyzeSubmissionOutput } from '$lib/common/output-analyzer/output-analyzer';
import { numInputCases } from '$lib/common/output-analyzer/input-analyzer';
import { contestRepo, problemRepo, submissionRepo, teamRepo } from '$lib/server/repos';
import type { Contest } from 'bwcontest-shared/types/contest';
import type { TeamPrivate } from 'bwcontest-shared/types/team';
import type { Submission } from 'bwcontest-shared/types/submission';
import type { ProblemPrivate } from 'bwcontest-shared/types/problem';

export const load: PageServerLoad = async () => {
	const submissions = await submissionRepo.getAll();
	return { submissions };
};

export const actions: Actions = {
	regenerateMissing: async () => {
		const report: string[] = [];
		let problemCount = 0;
		const log = function (text: string) {
			report.push(text);
		};
		const logProblem = function (text: string) {
			report.push(text);
			problemCount++;
		};

		try {
			const submissions = (await submissionRepo.getAll()).filter(
				(s) => s.actualOutput !== null && s.testCaseResults !== null
			);
			const contests = await contestRepo.getAll();
			const teams = await teamRepo.getAllPrivate();
			const problems = await problemRepo.getAllPrivate();
			await regenerateTestCaseResultsForSubmissions({
				contests,
				submissions,
				teams,
				problems,
				log,
				logProblem
			});
			return {
				success: true,
				reportJson: JSON.stringify(report),
				problemCount,
				count: submissions.length
			};
		} catch (err) {
			return {
				success: false,
				reportJson: JSON.stringify(report),
				problemCount,
				errorMessage: err?.toString() ?? 'error'
			};
		}
	},
	regenerateAll: async () => {
		const report: string[] = [];
		let problemCount = 0;
		const log = function (text: string) {
			report.push(text);
		};
		const logProblem = function (text: string) {
			report.push(text);
			problemCount++;
		};

		try {
			const submissions = (await submissionRepo.getAll()).filter((s) => s.actualOutput !== null);
			const contests = await contestRepo.getAll();
			const teams = await teamRepo.getAllPrivate();
			const problems = await problemRepo.getAllPrivate();
			await regenerateTestCaseResultsForSubmissions({
				submissions,
				contests,
				teams,
				problems,
				log,
				logProblem
			});
			return {
				success: true,
				reportJson: JSON.stringify(report),
				problemCount,
				count: submissions.length
			};
		} catch (err) {
			return {
				success: false,
				reportJson: JSON.stringify(report),
				problemCount,
				errorMessage: err?.toString() ?? 'error'
			};
		}
	}
};

async function regenerateTestCaseResultsForSubmissions(params: {
	contests: Array<Contest>;
	teams: Array<TeamPrivate>;
	submissions: Array<Submission>;
	problems: Array<ProblemPrivate>;
	log: (text: string) => void;
	logProblem: (text: string) => void;
}) {
	for (const submission of params.submissions) {
		const contest = params.contests.find((c) => c.id === submission.contestId);
		const team = params.teams.find((t) => t.id === submission.teamId);
		const problem = params.problems.find((p) => p.id === submission.problemId);
		if (
			submission.actualOutput === null ||
			contest === undefined ||
			team === undefined ||
			problem === undefined
		) {
			continue;
		}

		params.log(`Analyzing submission #${submission.id}`);
		params.log(`  Contest: ${contest.name}`);
		params.log(`  Team: ${team.name}`);
		params.log(`  Problem: ${problem.friendlyName}`);

		const analyzedOutput = analyzeSubmissionOutput(problem, submission.actualOutput);

		params.log(`  Resulting DB String: ${analyzedOutput?.databaseString ?? 'Unknown'}`);

		const testCasesExpected = numInputCases(problem.realInput);
		const testCasesReported = analyzedOutput?.testCaseResults.length ?? 'Unknown';

		params.log(`  Test Cases Expected: ${testCasesExpected}`);
		params.log(`  Test Cases Included: ${testCasesReported}`);

		if (testCasesExpected !== testCasesReported) {
			params.logProblem(`    ERROR: Test case count mismatch!`);
		}

		await submissionRepo.update(submission.id, {
			testCaseResults: analyzedOutput?.databaseString ?? 'Unknown'
		});
	}
}
