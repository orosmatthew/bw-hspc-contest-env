import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestTeamTable, teamTable } from '../db/schema';

export type TeamLanguage = 'java' | 'csharp' | 'cpp' | 'python';

export type TeamBase = {
	id: number;
	name: string;
	language: TeamLanguage;
	hasActiveTeam: boolean;
};

export type TeamPublic = TeamBase;

export type TeamPrivate = TeamBase & {
	password: string;
};

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

	async getByIdPrivate(id: number): Promise<TeamPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getPrivateFields())
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
				.select(this._getPrivateFields())
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
		try {
			const teams = await db
				.select(this._getPublicFields())
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

	async getAllPrivate(): Promise<Array<TeamPrivate>> {
		try {
			const teams = await db
				.select(this._getPrivateFields())
				.from(teamTable)
				.orderBy(teamTable.name);
			return teams;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getByNamePrivate(name: string): Promise<TeamPrivate | undefined> {
		try {
			return (
				await db.select(this._getPrivateFields()).from(teamTable).where(eq(teamTable.name, name))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	private _getHasActiveTeamExpression() {
		return sql<boolean>`exists(
            select 1 from ${activeTeamTable}
            where ${activeTeamTable.teamId} = ${teamTable.id})`;
	}

	private _getPublicFields() {
		return {
			id: teamTable.id,
			name: teamTable.name,
			language: teamTable.language,
			hasActiveTeam: this._getHasActiveTeamExpression()
		};
	}

	private _getPrivateFields() {
		return {
			id: teamTable.id,
			name: teamTable.name,
			language: teamTable.language,
			hasActiveTeam: this._getHasActiveTeamExpression(),
			password: teamTable.password
		};
	}
}
