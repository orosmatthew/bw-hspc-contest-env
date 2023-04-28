import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';

export const load = (async ({ cookies }) => {
	if (!cookies.get('token')) {
		throw redirect(302, '/login');
	}
	try {
		await db.session.delete({ where: { token: cookies.get('token') } });
	} catch {
		throw redirect(302, '/login');
	}
	cookies.delete('token');
	throw redirect(302, '/login');
}) satisfies PageServerLoad;
