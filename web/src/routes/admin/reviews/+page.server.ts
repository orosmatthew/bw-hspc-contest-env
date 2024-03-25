import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const selectedContestIdStr = cookies.get('selectedContest');
	const selectedContestId =
		selectedContestIdStr === undefined ? null : parseInt(selectedContestIdStr);

	if (selectedContestId == null) {
		return {
			timestamp: new Date(),
			reviewList: null,
			queueList: null
		};
	}

	const reviewList = await db.submission.findMany({
		where: { state: SubmissionState.InReview, contestId: selectedContestId },
		include: { contest: true, team: true, problem: true }
	});

	const queueList = await db.submission.findMany({
		where: { state: SubmissionState.Queued, contestId: selectedContestId },
		include: { contest: true, team: true, problem: true }
	});

	return {
		timestamp: new Date(),
		reviewList,
		queueList
	};
}) satisfies PageServerLoad;
