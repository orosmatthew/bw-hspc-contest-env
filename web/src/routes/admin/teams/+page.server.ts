import { db } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	const teams = await db.team.findMany();
	teams.sort((a, b) => {
		if (a.name < b.name) {
			return -1;
		}
		if (a.name > b.name) {
			return 1;
		}
		return 0;
	});
	return {
		teams: teams.map((row) => {
			return { id: row.id, name: row.name };
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		if (!name) {
			return { success: false };
		}
		try {
			await db.team.create({ data: { name: name.toString() } });
		} catch {
			return { success: false };
		}
		return { success: true };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const teamId = data.get('teamId');
		if (!teamId) {
			return { success: false };
		}
		const teamIdNum = parseInt(teamId.toString());
		try {
			await db.team.delete({ where: { id: teamIdNum } });
		} catch {
			return { success: false };
		}
		return { success: true };
	}
} satisfies Actions;
