import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable } from '../db/schema';
import type { ActiveTeamPrivate } from 'bwcontest-shared/types/active-team';

export class ActiveTeamRepo {
	public async createMany(values: Array<{ teamId: number; contestId: number }>): Promise<boolean> {
		try {
			if (values.length === 0) {
				return true;
			}
			await db
				.insert(activeTeamTable)
				.values(values.map((v) => ({ teamId: v.teamId, contestId: v.contestId })));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async getBySessionTokenPrivate(
		sessionToken: string
	): Promise<ActiveTeamPrivate | undefined> {
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

	public async getForTeamPrivate(teamId: number): Promise<ActiveTeamPrivate | undefined> {
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

	public async getInContestCount(contestId: number): Promise<number> {
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

	public async updateById(
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

	public async deleteInContest(contestId: number): Promise<boolean> {
		try {
			await db.delete(activeTeamTable).where(eq(activeTeamTable.contestId, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
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
