import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { submissionTable, teamTable } from '../db/schema';
import {
	submissionPublicSchema,
	type SubmissionDisplayState,
	type SubmissionPrivate,
	type SubmissionPublic,
	type SubmissionState,
	type SubmissionStateReason
} from 'bwcontest-shared/types/submission';

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

	async getByIdPrivate(id: number): Promise<SubmissionPrivate | undefined> {
		try {
			const submission = (
				await db
					.select(this._getFields())
					.from(submissionTable)
					.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
					.where(eq(submissionTable.id, id))
			).at(0);
			if (submission === undefined) {
				return undefined;
			}
			return { ...submission, displayState: this._calcDisplayState(submission.state) };
		} catch (e) {
			console.error(e);
		}
	}

	async getByIdPublic(id: number): Promise<SubmissionPublic | undefined> {
		return this._ensurePublicSingle(await this.getByIdPrivate(id));
	}

	async getAllPrivate(): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getLatestQueuedPrivate(): Promise<SubmissionPrivate | undefined> {
		try {
			const submission = (
				await db
					.select(this._getFields())
					.from(submissionTable)
					.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
					.where(eq(submissionTable.state, 'queued'))
					.orderBy(submissionTable.createdAt)
					.limit(1)
			).at(0);
			if (submission === undefined) {
				return undefined;
			}
			return { ...submission, displayState: this._calcDisplayState(submission.state) };
		} catch (e) {
			console.error(e);
		}
	}

	async getInContestPrivate(contestId: number): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.where(eq(submissionTable.contestId, contestId))
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestPublic(contestId: number): Promise<Array<SubmissionPublic>> {
		return this._ensurePublic(await this.getInContestPrivate(contestId));
	}

	async getInContestWithStatePrivate(
		contestId: number,
		state: SubmissionState
	): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.where(and(eq(submissionTable.contestId, contestId), eq(submissionTable.state, state)))
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamWithStatePrivate(
		contestId: number,
		teamId: number,
		state: SubmissionState
	): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.where(
					and(
						eq(submissionTable.contestId, contestId),
						eq(submissionTable.teamId, teamId),
						eq(submissionTable.state, state)
					)
				)
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamPrivate(
		contestId: number,
		teamId: number
	): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.where(and(eq(submissionTable.contestId, contestId), eq(submissionTable.teamId, teamId)))
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamPublic(
		contestId: number,
		teamId: number
	): Promise<Array<SubmissionPublic>> {
		return this._ensurePublic(await this.getInContestForTeamPrivate(contestId, teamId));
	}

	async getInContestForTeamForProblemPrivate(
		contestId: number,
		teamId: number,
		problemId: number
	): Promise<Array<SubmissionPrivate>> {
		try {
			const submissions = await db
				.select(this._getFields())
				.from(submissionTable)
				.innerJoin(teamTable, eq(teamTable.id, submissionTable.teamId))
				.where(
					and(
						eq(submissionTable.contestId, contestId),
						eq(submissionTable.teamId, teamId),
						eq(submissionTable.problemId, problemId)
					)
				)
				.orderBy(submissionTable.createdAt);
			return submissions.map((s) => ({ ...s, displayState: this._calcDisplayState(s.state) }));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async getInContestForTeamForProblemPublic(
		contestId: number,
		teamId: number,
		problemId: number
	): Promise<Array<SubmissionPublic>> {
		return this._ensurePublic(
			await this.getInContestForTeamForProblemPrivate(contestId, teamId, problemId)
		);
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

	private _calcDisplayState(state: SubmissionState): SubmissionDisplayState {
		switch (state) {
			case 'queued':
			case 'inReview':
				return 'processing';
			case 'correct':
				return 'correct';
			case 'incorrect':
				return 'incorrect';
		}
	}

	private _ensurePublicSingle(
		submission: SubmissionPublic | undefined
	): SubmissionPublic | undefined {
		if (submission === undefined) {
			return undefined;
		}
		return submissionPublicSchema.parse(submission);
	}

	private _ensurePublic(submissions: Array<SubmissionPublic>): Array<SubmissionPublic> {
		return submissions.map((p) => submissionPublicSchema.parse(p));
	}
}
