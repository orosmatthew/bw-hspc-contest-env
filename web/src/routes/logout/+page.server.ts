import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { logout } from '$lib/server/auth';

export const load = (async ({ cookies }) => {
	await logout(cookies);
	throw redirect(302, '/login');
}) satisfies PageServerLoad;
