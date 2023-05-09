import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';

export const load = (async ({ params }) => {
	if (!params.contestId) {
		throw redirect(302, '/admin/contests');
	}
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw redirect(302, '/admin/contests');
	}

	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { teams: true }
	});
	if (!contest) {
		throw redirect(302, '/admin/contests');
	}

	return {
		teams: contest.teams.map((team) => {
			return {
				id: team.id,
				name: team.name,
				password: team.password
			};
		})
	};
}) satisfies PageServerLoad;
