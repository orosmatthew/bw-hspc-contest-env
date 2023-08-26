import type { Actions } from '@sveltejs/kit';
import { attemptLogin } from '$lib/server/auth';

export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();
		if (!username || !password) {
			return { success: false };
		}
		if ((await attemptLogin(cookies, username, password)) !== true) {
			return { success: false };
		} else {
			return { success: true };
		}
	}
} satisfies Actions;
