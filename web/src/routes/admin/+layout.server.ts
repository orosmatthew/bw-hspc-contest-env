import { db } from '$lib/server/prisma';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const selectedContestIdStr = cookies.get('selectedContest');
	const selectedContestId =
		selectedContestIdStr === undefined ? null : parseInt(selectedContestIdStr);
	const contests = await db.contest.findMany({ select: { id: true, name: true } });
	return { contests, selectedContestId };
}) satisfies LayoutServerLoad;
