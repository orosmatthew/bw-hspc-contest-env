import type { Actions } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';
import * as UUID from 'uuid';

export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();
		if (!username || !password) {
			return { success: false };
		}
		const user = await db.user.findUnique({ where: { username: username } });
		if (!user) {
			return { success: false };
		}
		if (user.password === password) {
			const uuid: string = UUID.v4();
			await db.session.create({ data: { token: uuid, userId: user.id } });
			cookies.set('token', uuid);
			return { success: true };
		}
		return { success: false };
	}
} satisfies Actions;
