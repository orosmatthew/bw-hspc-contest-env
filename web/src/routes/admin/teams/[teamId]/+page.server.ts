import { db } from '$lib/server/prisma';
import { error } from 'console';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	const teamId = parseInt(params.teamId);
	if (isNaN(teamId)) {
		throw error(400, 'Invalid request');
	}
	const team = await db.team.findUnique({
		where: { id: teamId },
		select: { id: true, name: true, password: true }
	});
	if (!team) {
		throw redirect(302, '/admin/teams');
	}
	return { team: team };
}) satisfies PageServerLoad;

export const actions = {
	password: async ({ request, params }) => {
		const data = await request.formData();
		const newPass = data.get('password');
		if (!newPass) {
			return { success: false };
		}
		try {
			await db.team.update({
				where: { id: parseInt(params.teamId) },
				data: { password: newPass.toString() }
			});
		} catch {
			return { success: false };
		}
		return { success: true };
	}
} satisfies Actions;
