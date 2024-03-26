import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { scoreboardData } from '$lib/server/scoreboardData';

export const load = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw redirect(302, '/public/scoreboard');
	}
	const contestQuery = await db.contest.findUnique({ where: { id: contestId } });
	if (contestQuery === null) {
		throw redirect(302, '/public/scoreboard');
	}

	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: {
			problems: true,
			teams: {
				include: {
					submissions:
						contestQuery.freezeTime === null
							? true
							: { where: { createdAt: { lt: contestQuery.freezeTime } } }
				}
			}
		}
	});
	if (contest === null) {
		throw redirect(302, '/public/scoreboard');
	}
	return scoreboardData(contest);
}) satisfies PageServerLoad;
