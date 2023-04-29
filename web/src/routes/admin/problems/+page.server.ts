import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const query = await db.problem.findMany();
	return {
		problems: query.map((row) => {
			return { id: row.id, friendlyName: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;
