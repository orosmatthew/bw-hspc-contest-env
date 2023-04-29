import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const timestamp = new Date();
	const problems = await db.problem.findMany();
	const teams = await db.team.findMany();
	return {
		timestamp: timestamp,
		problems: problems.map((row) => {
			return { friendlyName: row.friendlyName };
		}),
		teams: teams.map((row) => {
			return { name: row.name };
		})
	};
}) satisfies PageServerLoad;
