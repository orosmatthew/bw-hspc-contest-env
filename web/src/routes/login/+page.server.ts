import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminSessionRepo } from '$lib/server/repos';
import z from 'zod';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('session');
	if (token !== undefined) {
		const session = await adminSessionRepo.getValidSession(token);
		if (session !== undefined) {
			redirect(307, '/admin');
		}
	}
};

const loginSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1)
});

export const actions: Actions = {
	login: async ({ cookies, request }) => {
		const form = loginSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const token = await adminSessionRepo.login({
			username: form.data.username,
			password: form.data.password
		});
		if (token === undefined) {
			return { success: false, message: 'Invalid login' };
		}
		cookies.set('session', token, { path: '/', secure: false });
		return { success: true };
	}
};
