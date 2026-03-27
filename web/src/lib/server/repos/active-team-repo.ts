import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable } from '../db/schema';

export type ActiveTeam = {
	id: number;
	teamId: number;
	sessionToken: string | null;
	sessionCreatedAt: Date | null;
	contestId: number;
};

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

	async getCountInContest(contestId: number): Promise<number> {
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

	async deleteInContest(contestId: number): Promise<boolean> {
		try {
			await db.delete(activeTeamTable).where(eq(activeTeamTable.contestId, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
}
