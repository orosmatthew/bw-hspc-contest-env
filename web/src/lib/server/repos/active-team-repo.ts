import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable } from '../db/schema';
import type { ActiveTeamPrivate } from 'bwcontest-shared/types/active-team';

export class ActiveTeamRepo {
	async createMany(values: Array<{ teamId: number; contestId: number }>): Promise<boolean> {
		try {
			db.transaction((tx) => {
				for (const entry of values) {
					tx.insert(activeTeamTable).values({ teamId: entry.teamId, contestId: entry.contestId });
				}
			});
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async getBySessionTokenPrivate(sessionToken: string): Promise<ActiveTeamPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getFieldsPrivate())
					.from(activeTeamTable)
					.where(eq(activeTeamTable.sessionToken, sessionToken))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async getForTeamPrivate(teamId: number): Promise<ActiveTeamPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getFieldsPrivate())
					.from(activeTeamTable)
					.where(eq(activeTeamTable.teamId, teamId))
					.limit(1)
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async getInContestCount(contestId: number): Promise<number> {
		try {
			const result = (
				await db
					.select({ count: count() })
					.from(activeTeamTable)
					.where(eq(activeTeamTable.contestId, contestId))
			).at(0);
			return result?.count ?? 0;
		} catch (e) {
			console.error(e);
			return 0;
		}
	}

	async update(
		id: number,
		values: { sessionToken?: string | null; sessionCreatedAt?: Date | null }
	): Promise<boolean> {
		try {
			await db
				.update(activeTeamTable)
				.set({ sessionToken: values.sessionToken, sessionCreatedAt: values.sessionCreatedAt })
				.where(eq(activeTeamTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async deleteInContest(contestId: number): Promise<boolean> {
		try {
			await db.delete(activeTeamTable).where(eq(activeTeamTable.contestId, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _getFieldsPublic() {
		return {
			id: activeTeamTable.id,
			teamId: activeTeamTable.teamId,
			contestId: activeTeamTable.contestId
		};
	}

	private _getFieldsPrivate() {
		return {
			id: activeTeamTable.id,
			teamId: activeTeamTable.teamId,
			sessionToken: activeTeamTable.sessionToken,
			sessionCreatedAt: activeTeamTable.sessionCreatedAt,
			contestId: activeTeamTable.contestId
		};
	}
}
