import { redirect, type Handle } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { startGitServer } from '$lib/server/gitserver';
import { hashPassword, isSessionValid, logout } from '$lib/server/auth';

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

try {
	const db = new PrismaClient();
	createDefaultAccount(db);
} catch (error) {
	console.log('Initialization in hooks failed (Normal on build)');
}

startGitServer();

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

	if (event.url.pathname.startsWith('/login')) {
		if ((await isSessionValid(event.cookies)) === true) {
			throw redirect(302, '/admin');
		}
	}
	if (event.url.pathname.startsWith('/admin')) {
		if ((await isSessionValid(event.cookies)) !== true) {
			logout(event.cookies);
			throw redirect(302, '/login');
		}
	}
	const res = await resolve(event);
	return res;
}) satisfies Handle;
