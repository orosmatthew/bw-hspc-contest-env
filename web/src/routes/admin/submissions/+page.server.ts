import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const submissions = await db.submission.findMany({
		include: { problem: true, team: true, contest: true }
	});
	return {
		timestamp: new Date(),
		submissions: submissions
	};
}) satisfies PageServerLoad;
