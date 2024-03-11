import { db } from '$lib/server/prisma';
import { timeoutSeconds } from '@submissionRunner/settings.cjs';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	console.log(`Timeout seconds is ${timeoutSeconds}`);

	const contests = await db.contest.findMany({ include: { activeTeams: true } });
	return {
		contests: contests.map((contest) => {
			return { id: contest.id, name: contest.name, activeTeams: contest.activeTeams.length };
		})
	};
}) satisfies PageServerLoad;
