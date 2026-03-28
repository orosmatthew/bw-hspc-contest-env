import { eq } from 'drizzle-orm';
import { db } from '../db';
import { submissionSourceFileTable } from '../db/schema';
import type { SubmissionSourceFile } from 'bwcontest-shared/types/submission-source-file';

export class SubmissionSourceFileRepo {
	async create(values: {
		submissionId: number;
		pathFromRootProblem: string;
		content: string;
	}): Promise<number | undefined> {
		try {
			return (
				await db
					.insert(submissionSourceFileTable)
					.values({
						submissionId: values.submissionId,
						pathFromProblemRoot: values.pathFromRootProblem,
						content: values.content
					})
					.returning({ id: submissionSourceFileTable.id })
			).at(0)?.id;
		} catch (e) {
			console.error(e);
		}
	}

	async getForSubmission(submissionId: number): Promise<Array<SubmissionSourceFile>> {
		try {
			return await db
				.select({
					id: submissionSourceFileTable.id,
					submissionId: submissionSourceFileTable.submissionId,
					pathFromProblemRoot: submissionSourceFileTable.pathFromProblemRoot,
					content: submissionSourceFileTable.content
				})
				.from(submissionSourceFileTable)
				.where(eq(submissionSourceFileTable.submissionId, submissionId));
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async deleteForSubmission(submissionId: number): Promise<boolean> {
		try {
			await db
				.delete(submissionSourceFileTable)
				.where(eq(submissionSourceFileTable.submissionId, submissionId));
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
}
