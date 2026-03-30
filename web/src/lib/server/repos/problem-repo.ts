import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contestProblemTable, problemTable } from '../db/schema';
import {
	problemPublicSchema,
	type ProblemBase,
	type ProblemPrivate,
	type ProblemPublic
} from 'bwcontest-shared/types/problem';

export class ProblemRepo {
	public async create(values: {
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

	public async getByIdPrivate(id: number): Promise<ProblemPrivate | undefined> {
		try {
			const problem = (
				await db.select(this._getFields()).from(problemTable).where(eq(problemTable.id, id))
			).at(0);
			return problem;
		} catch (e) {
			console.error(e);
		}
	}

	public async getInContestPrivate(contestId: number): Promise<Array<ProblemPrivate>> {
		try {
			const problems = await db
				.select(this._getFields())
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

	public async getInContestPublic(contestId: number): Promise<Array<ProblemPublic>> {
		return this._ensurePublic(await this.getInContestPrivate(contestId));
	}

	public async getAllPrivate(): Promise<Array<ProblemPrivate>> {
		try {
			const problems = await db
				.select(this._getFields())
				.from(problemTable)
				.orderBy(problemTable.friendlyName);
			return problems;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	public async getByPascalNamePrivate(pascalName: string): Promise<ProblemPrivate | undefined> {
		try {
			return (
				await db
					.select(this._getFields())
					.from(problemTable)
					.where(eq(problemTable.pascalName, pascalName))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	public async updateById(
		id: number,
		values: {
			friendlyName?: string;
			pascalName?: string;
			sampleInput?: string;
			sampleOutput?: string;
			realInput?: string;
			realOutput?: string;
			inputSpec?: string | null;
		}
	): Promise<boolean> {
		try {
			await db
				.update(problemTable)
				.set({
					friendlyName: values.friendlyName,
					pascalName: values.pascalName,
					sampleInput: values.sampleInput,
					sampleOutput: values.sampleOutput,
					realInput: values.realInput,
					realOutput: values.realOutput,
					inputSpec: values.inputSpec
				})
				.where(eq(problemTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async deleteById(id: number): Promise<boolean> {
		try {
			await db.delete(problemTable).where(eq(problemTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _getFields() {
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

	private _ensurePublic(problems: Array<ProblemBase>): Array<ProblemPublic> {
		return problems.map((p) => problemPublicSchema.parse(p));
	}
}
