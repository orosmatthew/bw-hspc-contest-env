import { eq } from 'drizzle-orm';
import { db } from '../db';
import { contestTable } from '../db/schema';

export type Contest = {
	id: number;
	name: string;
	startTime: Date | null;
	freezeTime: Date | null;
};

export class ContestRepo {
	async getById(id: number): Promise<Contest | undefined> {
		try {
			const contest = (
				await db
					.select({
						id: contestTable.id,
						name: contestTable.name,
						startTime: contestTable.startTime,
						freezeTime: contestTable.freezeTime
					})
					.from(contestTable)
					.where(eq(contestTable.id, id))
			).at(0);
			return contest;
		} catch (e) {
			console.error(e);
		}
	}
}
