import { db } from '../db';
import { submissionSourceFileTable } from '../db/schema';

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
}
