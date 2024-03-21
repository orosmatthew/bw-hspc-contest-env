import { db } from '$lib/server/prisma';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url }) => {
	const contests = await db.contest.findMany({ select: { id: true, name: true } });
	const selectedContestIdStr = url.searchParams.get('c');
	const selectedContestId = selectedContestIdStr === null ? null : parseInt(selectedContestIdStr);
	return { contests, selectedContestId };
}) satisfies LayoutServerLoad;
