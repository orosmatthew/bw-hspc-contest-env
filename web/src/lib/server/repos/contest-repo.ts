import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestProblemTable, contestTable, contestTeamTable } from '../db/schema';

export type Contest = {
	id: number;
	name: string;
	startTime: Date | null;
	freezeTime: Date | null;
	isFrozen: boolean;
	activeTeamsCount: number;
	isActive: boolean;
};

export class ContestRepo {
	async create(values: {
		name: string;
		startTime: Date | null;
		freezeTime: Date | null;
	}): Promise<number | undefined> {
		try {
			const contest = (
				await db
					.insert(contestTable)
					.values({ name: values.name, startTime: values.startTime, freezeTime: values.freezeTime })
					.returning({
						id: contestTable.id
					})
			).at(0);
			return contest?.id;
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	async getById(id: number): Promise<Contest | undefined> {
		try {
			const activeTeamsCountSubquery = this._getActiveTeamsCountSubquery();
			const contest = (
				await db
					.select({
						id: contestTable.id,
						name: contestTable.name,
						startTime: contestTable.startTime,
						freezeTime: contestTable.freezeTime,
						activeTeamsCount: activeTeamsCountSubquery.activeTeamsCount
					})
					.from(contestTable)
					.innerJoin(
						activeTeamsCountSubquery,
						eq(activeTeamsCountSubquery.contestId, contestTable.id)
					)
					.where(eq(contestTable.id, id))
			).at(0);
			if (contest === undefined) {
				return undefined;
			}
			return {
				...contest,
				isFrozen: this._calcIsFrozen(contest.freezeTime),
				isActive: contest.activeTeamsCount > 0
			};
		} catch (e) {
			console.error(e);
		}
	}

	async getAll(): Promise<Array<Contest>> {
		try {
			const activeTeamsCountSubquery = this._getActiveTeamsCountSubquery();
			const contests = await db
				.select({
					id: contestTable.id,
					name: contestTable.name,
					startTime: contestTable.startTime,
					freezeTime: contestTable.freezeTime,
					activeTeamsCount: activeTeamsCountSubquery.activeTeamsCount
				})
				.from(contestTable)
				.innerJoin(
					activeTeamsCountSubquery,
					eq(activeTeamsCountSubquery.contestId, contestTable.id)
				)
				.orderBy(contestTable.name);
			return contests.map((c) => ({
				...c,
				isFrozen: this._calcIsFrozen(c.freezeTime),
				isActive: c.activeTeamsCount > 0
			}));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async deleteById(contestId: number): Promise<boolean> {
		try {
			await db.delete(contestTable).where(eq(contestTable.id, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async updateStartTime(contestId: number, value: Date | null): Promise<boolean> {
		try {
			await db.update(contestTable).set({ startTime: value }).where(eq(contestTable.id, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async updateFreezeTime(contestId: number, value: Date | null): Promise<boolean> {
		try {
			await db
				.update(contestTable)
				.set({ freezeTime: value })
				.where(eq(contestTable.id, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async assignProblemIds(contestId: number, problemIds: Array<number>): Promise<boolean> {
		try {
			db.transaction((tx) => {
				tx.delete(contestProblemTable).where(eq(contestProblemTable.contestId, contestId));
				for (const problemId of problemIds) {
					tx.insert(contestProblemTable).values({ contestId, problemId });
				}
			});
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async assignTeamIds(contestId: number, teamIds: Array<number>): Promise<boolean> {
		try {
			db.transaction((tx) => {
				tx.delete(contestTeamTable).where(eq(contestTeamTable.contestId, contestId));
				for (const teamId of teamIds) {
					tx.insert(contestTeamTable).values({ contestId, teamId });
				}
			});
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _calcIsFrozen(freezeTime: Date | null) {
		return freezeTime === null ? false : new Date() >= freezeTime;
	}

	private _getActiveTeamsCountSubquery() {
		return db
			.select({ contestId: contestTable.id, activeTeamsCount: count(activeTeamTable.id) })
			.from(contestTable)
			.leftJoin(activeTeamTable, eq(activeTeamTable.contestId, contestTable.id))
			.groupBy(contestTable.id)
			.as('active_teams_count_subquery');
	}
}
