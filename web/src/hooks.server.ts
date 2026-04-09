import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { adminSessionRepo } from '$lib/server/repos';
import { gitServerService, jobService } from '$lib/server/services';
import { db } from '$lib/server/db';
import { resolve as resolvePath } from '$app/paths';

export const init: ServerInit = async () => {
	gitServerService.start();
	await jobService.startDeleteExpiredAdminSessionsJob();

	process.on('sveltekit:shutdown', async () => {
		console.log('Shutting down...');
		await jobService.stopAll();
		await gitServerService.stop();
		db.$client.close();
	});
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
			redirect(307, resolvePath('/login'));
		}
		const session = await adminSessionRepo.getValid(token);
		if (session === undefined) {
			redirect(307, resolvePath('/login'));
		}
	}
	const res = await resolve(event);
	return res;
}) satisfies Handle;
