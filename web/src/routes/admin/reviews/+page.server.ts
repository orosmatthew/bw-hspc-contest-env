import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const submissions = await db.submission.findMany({ where: { state: SubmissionState.InReview } });
	const teams = await db.team.findMany();
	const problems = await db.problem.findMany();
	return {
		timestamp: new Date(),
		reviewList: submissions.map((row) => {
			return { id: row.id, createdAt: row.createdAt };
		}),
		teams: teams.map((row) => {
			return { id: row.id, name: row.name };
		}),
		problems: problems.map((row) => {
			return { id: row.id, name: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;
