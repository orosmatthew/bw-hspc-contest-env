import { eq } from 'drizzle-orm';
import { db } from '../db';
import { submissionTable } from '../db/schema';

export const stateReasonValues = [
	'build_error',
	'time_limit_exceeded',
	'incorrect_overridden_as_correct',
	'sandbox_error'
] as const;
export type StateReason = (typeof stateReasonValues)[number];

export const submissionStateValues = ['queued', 'in_review', 'correct', 'incorrect'] as const;
export type SubmissionState = (typeof submissionStateValues)[number];

export class SubmissionRepo {
	async create(values: {
		createdAt: Date;
		gradedAt: Date | null;
		state: SubmissionState;
		stateReason: StateReason | null;
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

	async deleteInContest(contestId: number): Promise<boolean> {
		try {
			await db.delete(submissionTable).where(eq(submissionTable.contestId, contestId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
}
