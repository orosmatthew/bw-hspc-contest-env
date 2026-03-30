import { count, eq } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestProblemTable, contestTable, contestTeamTable } from '../db/schema';
import type { Contest } from 'bwcontest-shared/types/contest';

export class ContestRepo {
	public async create(values: {
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

	public async getById(id: number): Promise<Contest | undefined> {
		try {
			const contest = (
				await db
					.select({
						id: contestTable.id,
						name: contestTable.name,
						startTime: contestTable.startTime,
						freezeTime: contestTable.freezeTime,
						activeTeamsCount: count(activeTeamTable.id)
					})
					.from(contestTable)
					.leftJoin(activeTeamTable, eq(activeTeamTable.contestId, contestTable.id))
					.where(eq(contestTable.id, id))
					.groupBy(contestTable.id)
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

	public async getAll(): Promise<Array<Contest>> {
		try {
			const contests = await db
				.select({
					id: contestTable.id,
					name: contestTable.name,
					startTime: contestTable.startTime,
					freezeTime: contestTable.freezeTime,
					activeTeamsCount: count(activeTeamTable.id)
				})
				.from(contestTable)
				.leftJoin(activeTeamTable, eq(activeTeamTable.contestId, contestTable.id))
				.groupBy(contestTable.id)
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

	public async deleteById(contestId: number): Promise<boolean> {
		try {
			await db.delete(contestTable).where(eq(contestTable.id, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async updateById(
		id: number,
		values: { startTime?: Date | null; freezeTime?: Date | null }
	): Promise<boolean> {
		try {
			await db
				.update(contestTable)
				.set({ startTime: values.startTime, freezeTime: values.freezeTime })
				.where(eq(contestTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async assignProblemIds(contestId: number, problemIds: Array<number>): Promise<boolean> {
		try {
			await db.transaction(async (tx) => {
				await tx.delete(contestProblemTable).where(eq(contestProblemTable.contestId, contestId));
				if (problemIds.length > 0) {
					await tx
						.insert(contestProblemTable)
						.values(problemIds.map((id) => ({ contestId, problemId: id })));
				}
			});
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async assignTeamIds(contestId: number, teamIds: Array<number>): Promise<boolean> {
		try {
			await db.transaction(async (tx) => {
				await tx.delete(contestTeamTable).where(eq(contestTeamTable.contestId, contestId));
				if (teamIds.length > 0) {
					await tx
						.insert(contestTeamTable)
						.values(teamIds.map((id) => ({ contestId, teamId: id })));
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
}
