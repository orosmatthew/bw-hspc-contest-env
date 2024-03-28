import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const selectedContestId = locals.selectedContest;

	if (selectedContestId == null) {
		return {
			timestamp: new Date(),
			reviewList: null,
			queueList: null
		};
	}

	const reviewList = await db.submission.findMany({
		where: { state: 'InReview', contestId: selectedContestId },
		include: { contest: true, team: true, problem: true }
	});

	const queueList = await db.submission.findMany({
		where: { state: 'Queued', contestId: selectedContestId },
		include: { contest: true, team: true, problem: true }
	});

	return {
		timestamp: new Date(),
		reviewList,
		queueList
	};
}) satisfies PageServerLoad;
