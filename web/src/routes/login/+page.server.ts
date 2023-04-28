import type { Actions } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

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
			return { success: true };
		}
		return { success: false };
	}
} satisfies Actions;
