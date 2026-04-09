import { adminSessionRepo } from '$lib/server/repos';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageServerLoad = async () => {};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		const token = cookies.get('session');
		if (token !== undefined) {
			await adminSessionRepo.deleteByToken(token);
		}
		redirect(303, resolve('/login'));
	}
};
