import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { submissionTable, teamTable } from '../db/schema';

export const submissionStateReasonValues = [
	'build_error',
	'time_limit_exceeded',
	'incorrect_overridden_as_correct',
	'sandbox_error'
] as const;
export type SubmissionStateReason = (typeof submissionStateReasonValues)[number];

export const submissionStateValues = ['queued', 'in_review', 'correct', 'incorrect'] as const;
export type SubmissionState = (typeof submissionStateValues)[number];

export type Submission = {
	id: number;
	createdAt: Date;
	gradedAt: Date | null;
	state: SubmissionState;
	stateReason: SubmissionStateReason | null;
	stateReasonDetails: string | null;
	actualOutput: string | null;
	testCaseResults: string | null;
	exitCode: number | null;
	runtimeMilliseconds: number | null;
	commitHash: string;
	diff: string | null;
	message: string | null;
	teamId: number;
	problemId: number;
	contestId: number;

	teamName: string;
};

export class SubmissionRepo {
	async create(values: {
		createdAt: Date;
		gradedAt: Date | null;
		state: SubmissionState;
		stateReason: SubmissionStateReason | null;
		stateReasonDetails: string | null;
		actualOutput: string | null;
		testCaseResults: string | null;
		exitCode: number | null;
		runtimeMilliseconds: number | null;
		commitHash: string;
		diff: string | null;
		message: string | null;
		teamId: number;
		problemId: number;
		contestId: number;
	}): Promise<number | undefined> {
		try {
			return (
				await db
					.insert(submissionTable)
					.values({
						createdAt: values.createdAt,
						gradedAt: values.gradedAt,
						state: values.state,
						stateReason: values.stateReason,
						stateReasonDetails: values.stateReasonDetails,
						actualOutput: values.actualOutput,
						testCaseResults: values.testCaseResults,
						exitCode: values.exitCode,
						runtimeMilliseconds: values.runtimeMilliseconds,
						commitHash: values.commitHash,
						diff: values.diff,
						message: values.message,
						teamId: values.teamId,
						problemId: values.problemId,
						contestId: values.contestId
					})
					.returning({ id: submissionTable.id })
			).at(0)?.id;
		} catch (e) {
			console.error(e);
		}
	}

	async getById(id: number): Promise<Submission | undefined> {
		try {
			return (
				await db
					.select(this._getFields())
					.from(submissionTable)
					.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
					.where(eq(submissionTable.id, id))
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async getAll(): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getLatestQueued(): Promise<Submission | undefined> {
		try {
			return (
				await db
					.select(this._getFields())
					.from(submissionTable)
					.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
					.where(eq(submissionTable.state, 'queued'))
					.orderBy(submissionTable.createdAt)
					.limit(1)
			).at(0);
		} catch (e) {
			console.error(e);
		}
	}

	async getInContest(contestId: number): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.id))
				.where(eq(submissionTable.contestId, contestId))
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestWithState(
		contestId: number,
		state: SubmissionState
	): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.id))
				.where(and(eq(submissionTable.contestId, contestId), eq(submissionTable.state, state)))
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamWithState(
		contestId: number,
		teamId: number,
		state: SubmissionState
	): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.id))
				.where(
					and(
						eq(submissionTable.contestId, contestId),
						eq(submissionTable.teamId, teamId),
						eq(submissionTable.state, state)
					)
				)
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeam(contestId: number, teamId: number): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.id))
				.where(and(eq(submissionTable.contestId, contestId), eq(submissionTable.teamId, teamId)))
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamForProblem(
		contestId: number,
		teamId: number,
		problemId: number
	): Promise<Array<Submission>> {
		try {
			return await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.id))
				.where(
					and(
						eq(submissionTable.contestId, contestId),
						eq(submissionTable.teamId, teamId),
						eq(submissionTable.problemId, problemId)
					)
				)
				.orderBy(submissionTable.createdAt);
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async update(
		id: number,
		values: {
			gradedAt?: Date | null;
			state?: SubmissionState;
			stateReason?: SubmissionStateReason | null;
			stateReasonDetails?: string | null;
			actualOutput?: string | null;
			testCaseResults?: string | null;
			exitCode?: number | null;
			runtimeMilliseconds?: number | null;
			commitHash?: string;
			diff?: string | null;
			message?: string | null;
		}
	): Promise<boolean> {
		try {
			await db
				.update(submissionTable)
				.set({
					gradedAt: values.gradedAt,
					state: values.state,
					stateReason: values.stateReason,
					stateReasonDetails: values.stateReasonDetails,
					actualOutput: values.actualOutput,
					testCaseResults: values.testCaseResults,
					exitCode: values.exitCode,
					runtimeMilliseconds: values.runtimeMilliseconds,
					commitHash: values.commitHash,
					diff: values.diff,
					message: values.message
				})
				.where(eq(submissionTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async deleteInContest(contestId: number): Promise<boolean> {
		try {
			await db.delete(submissionTable).where(eq(submissionTable.contestId, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	async deleteById(id: number): Promise<boolean> {
		try {
			await db.delete(submissionTable).where(eq(submissionTable.id, id));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _getFields() {
		return {
			id: submissionTable.id,
			createdAt: submissionTable.createdAt,
			gradedAt: submissionTable.gradedAt,
			state: submissionTable.state,
			stateReason: submissionTable.stateReason,
			stateReasonDetails: submissionTable.stateReasonDetails,
			actualOutput: submissionTable.actualOutput,
			testCaseResults: submissionTable.testCaseResults,
			exitCode: submissionTable.exitCode,
			runtimeMilliseconds: submissionTable.runtimeMilliseconds,
			commitHash: submissionTable.commitHash,
			diff: submissionTable.diff,
			message: submissionTable.message,
			teamId: submissionTable.teamId,
			problemId: submissionTable.problemId,
			contestId: submissionTable.contestId,
			teamName: teamTable.name
		};
	}
}
