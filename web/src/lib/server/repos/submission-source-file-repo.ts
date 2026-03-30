import { eq } from 'drizzle-orm';
import { db } from '../db';
import { submissionSourceFileTable } from '../db/schema';
import type { SubmissionSourceFile } from 'bwcontest-shared/types/submission-source-file';

export class SubmissionSourceFileRepo {
	public async createMany(
		values: Array<{
			submissionId: number;
			pathFromProblemRoot: string;
			content: string;
		}>
	): Promise<boolean> {
		try {
			if (values.length === 0) {
				return true;
			}
			await db.insert(submissionSourceFileTable).values(
				values.map((v) => ({
					submissionId: v.submissionId,
					pathFromProblemRoot: v.pathFromProblemRoot,
					content: v.content
				}))
			);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	public async getForSubmission(submissionId: number): Promise<Array<SubmissionSourceFile>> {
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

	public async deleteForSubmission(submissionId: number): Promise<boolean> {
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
