import { logout } from '$lib/server/auth';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async ({ cookies }) => {
	await logout(cookies);
	return json({ success: true });
}) satisfies RequestHandler;
