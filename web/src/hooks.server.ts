import { redirect, type Handle } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { startGitServer } from '$lib/server/gitserver';
import { hashPassword, isSessionValid, logout } from '$lib/server/auth';
import { db } from '$lib/server/prisma';
import { building } from '$app/environment';

async function createDefaultAccount(db: PrismaClient) {
	const count = await db.user.count();
	if (count !== 0) {
		return;
	}
	const password = await hashPassword('bw123');
	await db.user.create({
		data: { username: 'admin', passwordHash: password.hash, passwordSalt: password.salt }
	});
}

if (!building) {
	console.log('Runtime initialization...');
	const db = new PrismaClient();
	createDefaultAccount(db);
	startGitServer();
}

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

	if (event.url.pathname.startsWith('/login')) {
		if ((await isSessionValid(event.cookies)) === true) {
			redirect(302, '/admin');
		}
	}
	if (event.url.pathname.startsWith('/admin')) {
		if ((await isSessionValid(event.cookies)) !== true) {
			logout(event.cookies);
			redirect(302, '/login');
		}
		const contestParam = event.url.searchParams.get('c');
		const contestCookie = event.cookies.get('selectedContest');
		if (contestParam !== null) {
			const selectedContest = parseInt(contestParam);
			if (isNaN(selectedContest)) {
				event.cookies.delete('selectedContest', { path: '/admin', secure: false });
				event.locals.selectedContest = null;
			} else {
				const contest = await db.contest.findUnique({ where: { id: selectedContest } });
				if (contest !== null) {
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
			const contest = await db.contest.findUnique({ where: { id: selectedContest } });
			if (contest !== null) {
				event.locals.selectedContest = selectedContest;
			} else {
				event.cookies.delete('selectedContest', { path: '/admin', secure: false });
				event.locals.selectedContest = null;
			}
		}
	}
	const res = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%theme%', event.locals.theme)
	});
	return res;
}) satisfies Handle;
