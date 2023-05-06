import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';
import type { Session } from '@prisma/client';
import { startGitServer } from '$lib/server/gitserver';

startGitServer();

const sessionExpireMilliseconds = 1000 * 60 * 60 * 24; // 24 hours

function isSessionExpired(session: Session): boolean {
	return session.createdAt.valueOf() + sessionExpireMilliseconds < new Date().valueOf();
}

async function removeExpiredSessions(userId: number) {
	const sessions: Session[] = await db.session.findMany({ where: { userId: userId } });
	sessions.forEach(async (session) => {
		if (isSessionExpired(session)) {
			await db.session.delete({ where: { token: session.token } });
		}
	});
}

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
		if (event.cookies.get('token')) {
			const session = await db.session.findUnique({ where: { token: event.cookies.get('token') } });
			if (session) {
				removeExpiredSessions(session.userId);
				if (!isSessionExpired(session)) {
					throw redirect(302, '/admin');
				} else {
					event.cookies.delete('token');
					const res = resolve(event);
					return res;
				}
			} else {
				const res = resolve(event);
				return res;
			}
		}
	}
	if (event.url.pathname.startsWith('/admin')) {
		if (event.cookies.get('token')) {
			const session = await db.session.findUnique({ where: { token: event.cookies.get('token') } });
			if (session) {
				removeExpiredSessions(session.userId);
				if (!isSessionExpired(session)) {
					const res = await resolve(event);
					return res;
				} else {
					event.cookies.delete('token');
					throw redirect(302, '/login');
				}
			} else {
				throw redirect(302, '/login');
			}
		} else {
			throw redirect(302, '/login');
		}
	}
	const res = await resolve(event);
	return res;
}) satisfies Handle;
