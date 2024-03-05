import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

export const GET = (async ({ params }) => {
	const session = params.session;
	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: session },
		include: {
			team: { select: { language: true, name: true } },
			contest: { select: { name: true } }
		}
	});
	if (activeTeam === null) {
		return json({ success: false });
	}
	return json({
		success: true,
		data: {
			teamName: activeTeam.team.name,
			teamId: activeTeam.teamId,
			contestName: activeTeam.contest.name,
			contestId: activeTeam.contestId,
			language: activeTeam.team.language
		}
	});
}) satisfies RequestHandler;
