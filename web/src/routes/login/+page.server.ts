import type { Actions } from '@sveltejs/kit';
import { attemptLogin } from '$lib/server/auth';

export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const formUsername = data.get('username');
		const formPassword = data.get('password');
		if (formUsername === null || formPassword === null) {
			return { success: false, message: 'Incomplete form data' };
		}
		if (
			(await attemptLogin(cookies, formUsername.toString().trim(), formPassword.toString())) !==
			true
		) {
			return { success: false, message: 'Invalid login' };
		} else {
			return { success: true };
		}
	}
} satisfies Actions;
