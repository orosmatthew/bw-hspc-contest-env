import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const submissions = await db.submission.findMany();
	const problems = await db.problem.findMany();
	const teams = await db.team.findMany();
	return {
		submissions: submissions.map((row) => {
			return {
				id: row.id,
				createdAt: row.createdAt,
				gradedAt: row.gradedAt,
				message: row.message,
				state: row.state,
				problemName: problems.find((problem) => {
					return problem.id == row.problemId;
				})?.friendlyName,
				teamName: teams.find((team) => {
					return team.id == row.teamId;
				})?.name
			};
		})
	};
}) satisfies PageServerLoad;
