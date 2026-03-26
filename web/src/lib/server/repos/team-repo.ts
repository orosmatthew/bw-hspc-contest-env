import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestTeamTable, teamTable } from '../db/schema';

export type TeamLanguage = 'java' | 'csharp' | 'cpp' | 'python';

export type Team = {
	id: number;
	name: string;
	password?: string;
	language: TeamLanguage;
	hasActiveTeam: boolean;
};

export type TeamGetParams = { forPublic: boolean };

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

	async getInContest(contestId: number, getParams: TeamGetParams): Promise<Array<Team>> {
		try {
			const teams = await this._getBaseSelect(getParams)
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

	async getAll(getParams: TeamGetParams): Promise<Array<Team>> {
		try {
			const teams = await this._getBaseSelect(getParams).from(teamTable).orderBy(teamTable.name);
			return teams;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getByName(name: string, getParams: TeamGetParams): Promise<Team | undefined> {
		try {
			return (
				await this._getBaseSelect(getParams).from(teamTable).where(eq(teamTable.name, name))
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

	private _getBaseSelect(getParams: TeamGetParams) {
		return db.select({
			id: teamTable.id,
			name: teamTable.name,
			language: teamTable.language,
			hasActiveTeam: this._getHasActiveTeamExpression(),
			...(getParams.forPublic ? {} : { password: teamTable.password })
		});
	}
}
