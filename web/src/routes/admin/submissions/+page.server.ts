import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const selectedContestId = locals.selectedContest;

	const submissions =
		selectedContestId != null
			? await db.submission.findMany({
					include: { problem: true, team: true, contest: true },
					where: { contestId: selectedContestId }
				})
			: null;

	return {
		timestamp: new Date(),
		submissions: submissions
	};
}) satisfies PageServerLoad;
