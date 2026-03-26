import { eq } from 'drizzle-orm';
import { db } from '../db';
import { submissionTable } from '../db/schema';

export class SubmissionRepo {
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
