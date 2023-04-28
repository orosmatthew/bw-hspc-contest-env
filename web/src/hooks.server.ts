import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';
import type { Session } from '@prisma/client';

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
	if (event.url.pathname.startsWith('/login')) {
		if (event.cookies.get('token')) {
			const session = await db.session.findUnique({ where: { token: event.cookies.get('token') } });
			if (session) {
				removeExpiredSessions(session.userId);
				if (!isSessionExpired(session)) {
					throw redirect(302, '/admin/reviews');
				} else {
					event.cookies.delete('token');
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
