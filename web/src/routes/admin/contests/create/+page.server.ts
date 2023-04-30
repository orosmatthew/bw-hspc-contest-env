import { db } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const teams = await db.team.findMany();
	const problems = await db.problem.findMany();
	return {
		teams: teams.map((row) => {
			return { id: row.id, name: row.name };
		}),
		problems: problems.map((row) => {
			return { id: row.id, name: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const problems = (await db.problem.findMany()).filter((problem) => {
			return data.get('problem_' + problem.id) !== null;
		});
		const teams = (await db.team.findMany()).filter((team) => {
			return data.get('team_' + team.id) !== null;
		});
		if (!name) {
			return { success: false };
		}
		await db.contest.create({
			data: {
				name: name.toString(),
				teams: {
					connect: teams.map((team) => {
						return { id: team.id };
					})
				},
				problems: {
					connect: problems.map((problem) => {
						return { id: problem.id };
					})
				}
			}
		});
		return { success: true };
	}
} satisfies Actions;
