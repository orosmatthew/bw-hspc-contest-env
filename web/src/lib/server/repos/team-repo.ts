import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { activeTeamTable, contestTeamTable, teamTable } from '../db/schema';

export type Team = {
	id: number;
	name: string;
	password?: string;
	language: 'java' | 'csharp' | 'cpp' | 'python';
	hasActiveTeam: boolean;
};

export type TeamGetParams = { forPublic: boolean };

export class TeamRepo {
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
