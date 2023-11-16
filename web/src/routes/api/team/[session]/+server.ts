import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

export const GET = (async ({ params }) => {
	const session = params.session;
	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: session },
		include: { team: { select: { language: true } } }
	});
	if (activeTeam === null) {
		return json({ success: false });
	}
	return json({
		success: true,
		data: {
			teamId: activeTeam.teamId,
			contestId: activeTeam.contestId,
			language: activeTeam.team.language
		}
	});
}) satisfies RequestHandler;
