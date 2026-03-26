import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contestTeamTable, teamTable } from '../db/schema';

export type Team = {
	id: number;
	name: string;
	password: string;
	language: 'java' | 'csharp' | 'cpp' | 'python';
};

export class TeamRepo {
	async getInContest(contestId: number): Promise<Array<Team>> {
		try {
			const teams = await db
				.select({
					id: teamTable.id,
					name: teamTable.name,
					password: teamTable.password,
					language: teamTable.language
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
