import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contestProblemTable, problemTable } from '../db/schema';

export type Problem = {
	id: number;
	friendlyName: string;
	pascalName: string;
	sampleInput: string;
	sampleOutput: string;
	realInput?: string;
	realOutput?: string;
	inputSpec?: string | null;
};

export type ProblemGetParams = { forPublic: boolean };

export class ProblemRepo {
	async getInContest(contestId: number, getParams: ProblemGetParams): Promise<Array<Problem>> {
		try {
			const base = getParams.forPublic
				? db.select({
						id: problemTable.id,
						friendlyName: problemTable.friendlyName,
						pascalName: problemTable.pascalName,
						sampleInput: problemTable.sampleInput,
						sampleOutput: problemTable.sampleOutput
					})
				: db.select({
						id: problemTable.id,
						friendlyName: problemTable.friendlyName,
						pascalName: problemTable.pascalName,
						sampleInput: problemTable.sampleInput,
						sampleOutput: problemTable.sampleOutput,
						realInput: problemTable.realInput,
						realOutput: problemTable.realOutput,
						inputSpec: problemTable.inputSpec
					});
			const problems = await base
				.from(problemTable)
				.innerJoin(contestProblemTable, eq(contestProblemTable.problemId, problemTable.id))
				.where(eq(contestProblemTable.contestId, contestId));
			return problems;
		} catch (e) {
			console.error(e);
			return [];
		}
	}
}
