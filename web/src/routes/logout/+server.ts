import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminSessionRepo } from '$lib/server/repos';

export const POST = (async ({ cookies }) => {
	const token = cookies.get('session');
	if (token !== undefined) {
		await adminSessionRepo.deleteByToken(token);
	}
	return json({ success: true });
}) satisfies RequestHandler;
