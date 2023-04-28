import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const query = await db.submission.findMany({ where: { state: SubmissionState.InReview } });
	query.sort((a, b) => {
		return a.createdAt.valueOf() - b.createdAt.valueOf();
	});
	return { reviewList: query };
}) satisfies PageServerLoad;

export const actions = {
	submission: async ({ request }) => {
		const data = await request.formData();
		const expected = data.get('expected');
		const actual = data.get('actual');
		if (!expected || !actual) {
			return { success: false };
		}
		if (expected.toString() === actual.toString()) {
			return { success: true };
		}
		await db.submission.create({
			data: {
				state: SubmissionState.InReview,
				expectedOutput: expected.toString(),
				actualOutput: actual.toString()
			}
		});
	}
} satisfies Actions;
