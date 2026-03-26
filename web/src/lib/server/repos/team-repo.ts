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

export type GetTeamParams = { forPublic: boolean };

export class TeamRepo {
	private _getHasActiveTeamExpr(params: { contestId: number }) {
		return sql<boolean>`exists(
            select 1 from ${activeTeamTable}
            where ${activeTeamTable.teamId} = ${teamTable.id}
            and ${activeTeamTable.contestId} = ${params.contestId})`;
	}

	async getInContest(contestId: number, getParams: GetTeamParams): Promise<Array<Team>> {
		try {
			const teams = await db
				.select({
					id: teamTable.id,
					name: teamTable.name,
					language: teamTable.language,
					hasActiveTeam: this._getHasActiveTeamExpr({ contestId }),
					...(getParams.forPublic ? {} : { password: teamTable.password })
				})
				.from(teamTable)
				.innerJoin(contestTeamTable, eq(contestTeamTable.teamId, teamTable.id))
				.where(eq(contestTeamTable.contestId, contestId));
			return teams;
		} catch (e) {
			console.error(e);
			return [];
		}
	}
}
