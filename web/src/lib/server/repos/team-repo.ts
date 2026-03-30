import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestTeamTable, teamTable } from '../db/schema';
import {
	teamPublicSchema,
	type TeamLanguage,
	type TeamPrivate,
	type TeamPublic
} from 'bwcontest-shared/types/team';

export class TeamRepo {
	async create(values: {
		name: string;
		password: string;
		language: TeamLanguage;
	}): Promise<number | undefined> {
		try {
			const result = (
				await db
					.insert(teamTable)
					.values({ name: values.name, password: values.password, language: values.language })
					.returning({
						id: teamTable.id
					})
			).at(0);
			return result?.id;
		} catch (e) {
			console.error(e);
		}
	}

	async getByIdPublic(id: number): Promise<TeamPublic | undefined> {
		return this._ensurePublicSingle(await this.getByIdPrivate(id));
	}

	async getByIdPrivate(id: number): Promise<TeamPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getFields())
					.from(teamTable)
					.innerJoin(contestTeamTable, eq(contestTeamTable.teamId, teamTable.id))
					.where(eq(teamTable.id, id))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async getInContestPrivate(contestId: number): Promise<Array<TeamPrivate>> {
		try {
			const teams = await db
				.select(this._getFields())
				.from(teamTable)
				.innerJoin(contestTeamTable, eq(contestTeamTable.teamId, teamTable.id))
				.where(eq(contestTeamTable.contestId, contestId))
				.orderBy(teamTable.name);
			return teams;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestPublic(contestId: number): Promise<Array<TeamPublic>> {
		return this._ensurePublic(await this.getInContestPrivate(contestId));
	}

	async getAllPrivate(): Promise<Array<TeamPrivate>> {
		try {
			const teams = await db.select(this._getFields()).from(teamTable).orderBy(teamTable.name);
			return teams;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getByNamePrivate(name: string): Promise<TeamPrivate | undefined> {
		try {
			return (
				await db.select(this._getFields()).from(teamTable).where(eq(teamTable.name, name))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async update(
		id: number,
		values: { name?: string; language?: TeamLanguage; password?: string }
	): Promise<boolean> {
		try {
			await db
				.update(teamTable)
				.set({ name: values.name, language: values.language, password: values.password })
				.where(eq(teamTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async deleteById(id: number): Promise<boolean> {
		try {
			await db.delete(teamTable).where(eq(teamTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _getHasActiveTeamExpression() {
		return sql`exists(
            select 1 from ${activeTeamTable}
            where ${activeTeamTable.teamId} = ${teamTable.id})`.mapWith(Boolean);
	}

	private _getFields() {
		return {
			id: teamTable.id,
			name: teamTable.name,
			language: teamTable.language,
			hasActiveTeam: this._getHasActiveTeamExpression(),
			password: teamTable.password
		};
	}

	private _ensurePublicSingle(team: TeamPublic | undefined): TeamPublic | undefined {
		if (team === undefined) {
			return undefined;
		}
		return teamPublicSchema.parse(team);
	}

	private _ensurePublic(teams: Array<TeamPublic>): Array<TeamPublic> {
		return teams.map((p) => teamPublicSchema.parse(p));
	}
}
