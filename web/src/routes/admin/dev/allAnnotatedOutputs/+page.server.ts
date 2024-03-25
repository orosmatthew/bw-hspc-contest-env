import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const submissions = await db.submission.findMany({ include: { problem: true, team: true } });
	return {
		submissions
	};
}) satisfies PageServerLoad;
