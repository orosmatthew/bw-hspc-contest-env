import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const query = await db.problem.findMany();
	query.sort((a, b) => {
		if (a.friendlyName < b.friendlyName) {
			return -1;
		}
		if (a.friendlyName > b.friendlyName) {
			return 1;
		}
		return 0;
	});
	return {
		problems: query.map((row) => {
			return { id: row.id, friendlyName: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;
