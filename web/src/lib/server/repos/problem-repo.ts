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
	async create(values: {
		friendlyName: string;
		pascalName: string;
		sampleInput: string;
		sampleOutput: string;
		realInput: string;
		realOutput: string;
		inputSpec: string | null;
	}): Promise<number | undefined> {
		try {
			return (
				await db
					.insert(problemTable)
					.values({
						friendlyName: values.friendlyName,
						pascalName: values.pascalName,
						sampleInput: values.sampleInput,
						sampleOutput: values.sampleOutput,
						realInput: values.realInput,
						realOutput: values.realOutput,
						inputSpec: values.inputSpec
					})
					.returning({ id: problemTable.id })
			).at(0)?.id;
		} catch (e) {
			console.error(e);
		}
	}

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

	async getByPascalName(
		pascalName: string,
		getParams: ProblemGetParams
	): Promise<Problem | undefined> {
		try {
			return (
				await this._getBaseSelect(getParams)
					.from(problemTable)
					.where(eq(problemTable.pascalName, pascalName))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async updateInputSpec(problemId: number, value: string | null): Promise<boolean> {
		try {
			await db.update(problemTable).set({ inputSpec: value }).where(eq(problemTable.id, problemId));
            return true;
		} catch (e) {
			console.error(e);
			return false;
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
