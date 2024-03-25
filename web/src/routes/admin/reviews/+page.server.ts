import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const reviewList = await db.submission.findMany({ 
		where: { state: SubmissionState.InReview },
		include: { contest: true, team: true, problem: true }
	});

	const queueList = await db.submission.findMany({ 
		where: { state: SubmissionState.Queued },
		include: { contest: true, team: true, problem: true }
	});

	return {
		timestamp: new Date(),
		reviewList,
		queueList
	};
}) satisfies PageServerLoad;
