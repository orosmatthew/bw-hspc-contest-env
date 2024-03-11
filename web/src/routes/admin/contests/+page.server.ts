import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const contests = await db.contest.findMany({ include: { activeTeams: true } });
	return {
		contests: contests.map((contest) => {
			return { id: contest.id, name: contest.name, activeTeams: contest.activeTeams.length };
		})
	};
}) satisfies PageServerLoad;
