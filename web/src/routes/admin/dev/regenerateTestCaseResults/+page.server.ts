import { db } from '$lib/server/prisma';
import type { Contest, Problem, Submission, Team } from '@prisma/client';
import type { PageServerLoad } from './$types';
import { analyzeSubmissionOutput } from '$lib/outputAnalyzer/outputAnalyzer';
import type { Actions } from '@sveltejs/kit';
import { numInputCases as numInputCasesFromHeader } from '$lib/outputAnalyzer/inputAnalyzer';

export const load = (async () => {
	const submissions = await db.submission.findMany({ include: { problem: true, team: true } });
	return {
		submissions
	};
}) satisfies PageServerLoad;

export const actions = {
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
			const submissions = await db.submission.findMany({
				where: { actualOutput: { not: null }, testCaseResults: null },
				include: { problem: true, team: true, contest: true }
			});
			await regenerateTestCaseResultsForSubmissions(submissions, log, logProblem);
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
			const submissions = await db.submission.findMany({
				where: { actualOutput: { not: null } },
				include: { problem: true, team: true, contest: true }
			});
			await regenerateTestCaseResultsForSubmissions(submissions, log, logProblem);
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
} satisfies Actions;

async function regenerateTestCaseResultsForSubmissions(
	submissions: (Submission & { problem: Problem; contest: Contest; team: Team })[],
	log: (text: string) => void,
	logProblem: (text: string) => void
) {
	for (const submission of submissions) {
		if (submission.actualOutput == null) {
			continue;
		}

		log(`Analyzing submission #${submission.id}`);
		log(`  Contest: ${submission.contest.name}`);
		log(`  Team: ${submission.team.name}`);
		log(`  Problem: ${submission.problem.friendlyName}`);

		const analyzedOutput = analyzeSubmissionOutput(submission.problem, submission.actualOutput);

		log(`  Resulting DB String: ${analyzedOutput.databaseString}`);

		const testCasesExpected = numInputCasesFromHeader(submission.problem.realInput);
		const testCasesReported = analyzedOutput.testCaseResults.length;

		log(`  Test Cases Expected: ${testCasesExpected}`);
		log(`  Test Cases Included: ${testCasesReported}`);

		if (testCasesExpected != testCasesReported) {
			logProblem(`    ERROR: Test case count mismatch!`);
		}

		await db.submission.update({
			where: { id: submission.id },
			data: { testCaseResults: analyzedOutput.databaseString }
		});
	}
}
