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
			const problems = await this._getBaseSelect(getParams)
				.from(problemTable)
				.innerJoin(contestProblemTable, eq(contestProblemTable.problemId, problemTable.id))
				.where(eq(contestProblemTable.contestId, contestId))
				.orderBy(problemTable.friendlyName);
			return problems;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getAll(getParams: ProblemGetParams): Promise<Array<Problem>> {
		try {
			const problems = await this._getBaseSelect(getParams)
				.from(problemTable)
				.orderBy(problemTable.friendlyName);
			return problems;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	private _getBaseSelect(getParams: ProblemGetParams) {
		return db.select({
			id: problemTable.id,
			friendlyName: problemTable.friendlyName,
			pascalName: problemTable.pascalName,
			sampleInput: problemTable.sampleInput,
			sampleOutput: problemTable.sampleOutput,
			...(getParams.forPublic
				? {}
				: {
						realInput: problemTable.realInput,
						realOutput: problemTable.realOutput,
						inputSpec: problemTable.inputSpec
					})
		});
	}
}
