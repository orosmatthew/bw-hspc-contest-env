import { redirect, type Cookies } from '@sveltejs/kit';
import { db } from './prisma';
import bcrypt from 'bcrypt';

export const sessionExpireSeconds = 60 * 60 * 24; // A day

export async function hashPassword(
	password: string,
	salt?: string
): Promise<{ salt: string; hash: string }> {
	if (salt === undefined) {
		salt = await bcrypt.genSalt();
	}
	const hash = await bcrypt.hash(password, salt);
	return { salt: salt, hash: hash };
}

export async function deleteExpiredSessions(userId: number) {
	const expirationDate = new Date(new Date().valueOf() - 1000 * sessionExpireSeconds);
	await db.session.deleteMany({
		where: {
			userId: userId,
			createdAt: { lt: expirationDate }
		}
	});
}

export async function logout(cookies: Cookies): Promise<boolean> {
	const sessionCookie = cookies.get('session');
	if (sessionCookie === undefined) {
		return false;
	}
	cookies.delete('session');
	try {
		await db.session.delete({ where: { token: sessionCookie } });
	} catch {
		return false;
	}
	return true;
}

export async function attemptLogin(
	cookies: Cookies,
	username: string,
	password: string
): Promise<boolean> {
	if (username === '' || password === '') {
		return false;
	}
	const user = await db.user.findUnique({ where: { username: username.toString() } });
	if (!user) {
		return false;
	}
	deleteExpiredSessions(user.id);
	const hash = await hashPassword(password, user.passwordSalt);
	if (user.passwordHash === hash.hash.toString()) {
		const session = await db.session.create({ data: { userId: user.id } });
		cookies.set('session', session.token, {
			// secure: process.env.NODE_ENV === 'development' ? false : true,
			secure: false,
			httpOnly: true,
			sameSite: 'strict',
			maxAge: sessionExpireSeconds
		});
		return true;
	}
	return false;
}

export async function isSessionValid(cookies: Cookies): Promise<boolean> {
	const sessionCookie = cookies.get('session');
	if (sessionCookie === undefined) {
		return false;
	}
	const session = await db.session.findUnique({ where: { token: sessionCookie } });
	if (!session) {
		return false;
	}
	if (new Date().valueOf() - session.createdAt.valueOf() > 1000 * sessionExpireSeconds) {
		await db.session.delete({ where: { token: session.token } });
		return false;
	}
	return true;
}

export async function redirectIfSessionInvalid(url: string, cookies: Cookies): Promise<void> {
	if (!(await isSessionValid(cookies))) {
		throw redirect(302, url);
	}
}
