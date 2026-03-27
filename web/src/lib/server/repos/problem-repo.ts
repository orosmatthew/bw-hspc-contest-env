import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contestProblemTable, problemTable } from '../db/schema';

export type ProblemBase = {
	id: number;
	friendlyName: string;
	pascalName: string;
	sampleInput: string;
	sampleOutput: string;
};

export type ProblemPublic = ProblemBase;

export type ProblemPrivate = ProblemBase & {
	realInput: string;
	realOutput: string;
	inputSpec: string | null;
};

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

	async getByIdPrivate(id: number): Promise<ProblemPrivate | undefined> {
		try {
			const problem = (
				await db.select(this._getPrivateFields()).from(problemTable).where(eq(problemTable.id, id))
			).at(0);
			return problem;
		} catch (e) {
			console.error(e);
		}
	}

	async getInContestPrivate(contestId: number): Promise<Array<ProblemPrivate>> {
		try {
			const problems = await db
				.select(this._getPrivateFields())
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

	async getAllPrivate(): Promise<Array<ProblemPrivate>> {
		try {
			const problems = await db
				.select(this._getPrivateFields())
				.from(problemTable)
				.orderBy(problemTable.friendlyName);
			return problems;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getByPascalNamePrivate(pascalName: string): Promise<ProblemPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getPrivateFields())
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

	private _getPublicFields() {
		return {
			id: problemTable.id,
			friendlyName: problemTable.friendlyName,
			pascalName: problemTable.pascalName,
			sampleInput: problemTable.sampleInput,
			sampleOutput: problemTable.sampleOutput
		};
	}

	private _getPrivateFields() {
		return {
			id: problemTable.id,
			friendlyName: problemTable.friendlyName,
			pascalName: problemTable.pascalName,
			sampleInput: problemTable.sampleInput,
			sampleOutput: problemTable.sampleOutput,
			realInput: problemTable.realInput,
			realOutput: problemTable.realOutput,
			inputSpec: problemTable.inputSpec
		};
	}
}
