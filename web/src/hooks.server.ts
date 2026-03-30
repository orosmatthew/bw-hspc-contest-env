import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { startGitServer } from '$lib/server/git-server';
import { adminSessionRepo, contestRepo } from '$lib/server/repos';

export const init: ServerInit = async () => {
	console.log('Runtime initialization...');
	startGitServer();
};

export const handle = (async ({ event, resolve }) => {
	const theme = event.cookies.get('theme') as 'light' | 'dark' | undefined;
	event.locals.theme = theme ?? 'dark';

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
		const contestParam = event.url.searchParams.get('c');
		const contestCookie = event.cookies.get('selectedContest');
		if (contestParam !== null) {
			const selectedContest = parseInt(contestParam);
			if (isNaN(selectedContest)) {
				event.cookies.delete('selectedContest', { path: '/admin', secure: false });
				event.locals.selectedContest = null;
			} else {
				const contest = await contestRepo.getById(selectedContest);
				if (contest !== undefined) {
					event.cookies.set('selectedContest', contestParam, { path: '/admin', secure: false });
					event.locals.selectedContest = selectedContest;
				} else {
					event.cookies.delete('selectedContest', { path: '/admin', secure: false });
					event.locals.selectedContest = null;
				}
			}
		} else if (contestCookie !== undefined) {
			const selectedContest = parseInt(contestCookie);
			if (isNaN(selectedContest)) {
				event.cookies.delete('selectedContest', { path: '/admin', secure: false });
				event.locals.selectedContest = null;
			}
			const contest = await contestRepo.getById(selectedContest);
			if (contest !== undefined) {
				event.locals.selectedContest = selectedContest;
			} else {
				event.cookies.delete('selectedContest', { path: '/admin', secure: false });
				event.locals.selectedContest = null;
			}
		} else {
			event.locals.selectedContest = null;
		}
	}
	const res = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%theme%', event.locals.theme)
	});
	return res;
}) satisfies Handle;
