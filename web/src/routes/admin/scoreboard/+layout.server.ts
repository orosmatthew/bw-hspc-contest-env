import { db } from '$lib/server/prisma';
import type { LayoutServerLoad } from './$types';

export const load = (async () => {
	const contests = await db.contest.findMany({ select: { id: true, name: true } });
	return { contests };
}) satisfies LayoutServerLoad;
