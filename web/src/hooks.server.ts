import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { startGitServer } from '$lib/server/git-server';
import { adminSessionRepo } from '$lib/server/repos';

export const init: ServerInit = async () => {
	console.log('Runtime initialization...');
	startGitServer();
};

export const handle = (async ({ event, resolve }) => {
	if (event.request.method === 'OPTIONS') {
		return new Response('ok', {
			headers: {
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	}

	if (event.url.pathname.startsWith('/admin')) {
		const token = event.cookies.get('session');
		if (token === undefined) {
			redirect(307, '/login');
		}
		const session = await adminSessionRepo.getValid(token);
		if (session === undefined) {
			redirect(307, '/login');
		}
	}
	const res = await resolve(event);
	return res;
}) satisfies Handle;
