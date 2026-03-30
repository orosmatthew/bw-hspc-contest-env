import { randomUUID } from 'crypto';
import { db } from '../db';
import { adminSessionTable } from '../db/schema';
import { eq, and, lte, gt } from 'drizzle-orm';
import type { AdminSession } from 'bwcontest-shared/types/admin-session';

export class AdminSessionRepo {
	private _adminUsername: string;
	private _adminPassword: string;
	private _expiresMinutes: number;

	public constructor(params: {
		adminUsername: string;
		adminPassword: string;
		expiresMinutes: number;
	}) {
		this._adminUsername = params.adminUsername.trim();
		this._adminPassword = params.adminPassword;
		this._expiresMinutes = params.expiresMinutes;
	}

	public async create(params: { username: string; password: string }): Promise<string | undefined> {
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

	public async deleteByToken(token: string): Promise<void> {
		try {
			await db.delete(adminSessionTable).where(eq(adminSessionTable.token, token));
		} catch (e) {
			console.error(e);
		}
	}

	public async getValid(token: string): Promise<AdminSession | undefined> {
		try {
			const session = (
				await db
					.select()
					.from(adminSessionTable)
					.where(
						and(
							eq(adminSessionTable.token, token),
							gt(adminSessionTable.createdAt, this._getCutoff())
						)
					)
			).at(0);
			return session;
		} catch (e) {
			console.error(e);
		}
	}

	public async deleteExpired() {
		try {
			await db.delete(adminSessionTable).where(lte(adminSessionTable.createdAt, this._getCutoff()));
		} catch (e) {
			console.error(e);
		}
	}

	private _getCutoff() {
		return new Date(Date.now() - 1000 * 60 * this._expiresMinutes);
	}
}
