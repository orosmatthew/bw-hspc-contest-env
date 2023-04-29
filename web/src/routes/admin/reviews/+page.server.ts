import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const submissions = await db.submission.findMany({ where: { state: SubmissionState.InReview } });
	const teams = await db.team.findMany();
	const problems = await db.problem.findMany();
	return {
		reviewList: submissions.map((row) => {
			return { id: row.id, createdAt: row.createdAt };
		}),
		teams: teams.map((row) => {
			return { id: row.id, name: row.name };
		}),
		problems: problems.map((row) => {
			return { id: row.id, name: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	submission: async ({ request }) => {
		const data = await request.formData();
		const teamId = data.get('teamId');
		const problemId = data.get('problemId');
		const actual = data.get('actual');
		if (!teamId || !problemId || !actual) {
			return { success: false };
		}
		const problemIdInt = parseInt(problemId.toString());
		const teamIdInt = parseInt(teamId.toString());
		if (isNaN(problemIdInt) || isNaN(teamIdInt)) {
			return { success: false };
		}
		const problem = await db.problem.findUnique({ where: { id: problemIdInt } });
		if (!problem) {
			return { success: false };
		}
		if (problem.realOutput === actual.toString()) {
			await db.submission.create({
				data: {
					state: SubmissionState.Correct,
					actualOutput: actual.toString(),
					teamId: teamIdInt,
					problemId: problemIdInt,
					gradedAt: new Date()
				}
			});
			return { success: true };
		}
		await db.submission.create({
			data: {
				state: SubmissionState.InReview,
				actualOutput: actual.toString(),
				teamId: teamIdInt,
				problemId: problemIdInt
			}
		});
		return { success: true };
	}
} satisfies Actions;
