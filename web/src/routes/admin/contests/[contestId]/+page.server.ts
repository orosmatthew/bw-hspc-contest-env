import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';

export const load = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw error(400, 'Invalid request');
	}
	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { problems: true, teams: true }
	});
	if (!contest) {
		throw redirect(302, '/admin/contests');
	}
	return {
		name: contest.name,
		problems: contest.problems.map((problem) => {
			return { name: problem.friendlyName };
		}),
		teams: contest.teams.map((team) => {
			return { name: team.name };
		})
	};
}) satisfies PageServerLoad;
