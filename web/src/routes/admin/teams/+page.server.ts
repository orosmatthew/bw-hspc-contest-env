import { db } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';
import { genPassword } from './util';

export const load = (async () => {
	const teams = await db.team.findMany({
		select: { id: true, name: true, language: true, password: true },
		orderBy: { name: 'asc' }
	});
	return { teams };
}) satisfies PageServerLoad;

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const lang = data.get('lang');
		if (name === null || lang === null) {
			return { success: false, message: 'Incomplete form data' };
		}
		if (lang !== 'Java' && lang !== 'CSharp') {
			return { success: false, message: 'Invalid language' };
		}
		try {
			await db.team.create({
				data: { name: name.toString(), password: genPassword(), language: lang }
			});
		} catch {
			return { success: false, message: 'Database error' };
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
	},
	edit: async ({ request }) => {
		const data = await request.formData();
		const teamId = data.get('id');
		const name = data.get('name');
		const lang = data.get('lang');
		const password = data.get('password');
		if (teamId === null || name === null || lang === null || password === null) {
			return { success: false, message: 'Incomplete form data' };
		}
		if (lang !== 'Java' && lang !== 'CSharp') {
			return { success: false, message: 'Invalid language' };
		}
		try {
			await db.team.update({
				where: { id: parseInt(teamId.toString()) },
				data: { name: name.toString(), language: lang, password: password.toString() }
			});
		} catch (e) {
			console.error(e);
			return { success: false, message: 'Database error' };
		}
		return { success: true };
	}
} satisfies Actions;
