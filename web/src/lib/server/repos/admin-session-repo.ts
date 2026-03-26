import { randomUUID } from 'crypto';
import { db } from '../db';
import { adminSessionTable } from '../db/schema';
import { eq, and, lte, gt } from 'drizzle-orm';

export type AdminSession = {
	token: string;
	createdAt: Date;
};

export class AdminSessionRepo {
	private _adminUsername: string;
	private _adminPassword: string;
	private _expiresMinutes: number;

	constructor(params: { adminUsername: string; adminPassword: string; expiresMinutes: number }) {
		this._adminUsername = params.adminUsername.trim();
		this._adminPassword = params.adminPassword;
		this._expiresMinutes = params.expiresMinutes;
	}

	async login(params: { username: string; password: string }): Promise<string | undefined> {
		if (params.username.trim() !== this._adminUsername || params.password !== this._adminPassword) {
			return undefined;
		}
		try {
			const session = (
				await db
					.insert(adminSessionTable)
					.values({ token: randomUUID(), createdAt: new Date() })
					.returning({ token: adminSessionTable.token })
			).at(0);
			return session?.token;
		} catch (e) {
			console.error(e);
		}
	}

	async logout(token: string): Promise<void> {
		try {
			await db.delete(adminSessionTable).where(eq(adminSessionTable.token, token));
		} catch (e) {
			console.error(e);
		}
	}

	async getValidSession(token: string): Promise<AdminSession | undefined> {
		try {
			const cutoff = new Date(new Date().valueOf() - 1000 * 60 * this._expiresMinutes);
			const session = (
				await db
					.select()
					.from(adminSessionTable)
					.where(and(eq(adminSessionTable.token, token), gt(adminSessionTable.createdAt, cutoff)))
			).at(0);
			return session;
		} catch (e) {
			console.error(e);
		}
	}

	async deleteExpired() {
		const cutoff = new Date(new Date().valueOf() - 1000 * 60 * this._expiresMinutes);
		try {
			await db.delete(adminSessionTable).where(lte(adminSessionTable.createdAt, cutoff));
		} catch (e) {
			console.error(e);
		}
	}
}
