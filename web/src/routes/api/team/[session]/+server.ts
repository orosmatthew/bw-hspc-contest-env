import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

export const GET = (async ({ params }) => {
	const session = params.session;
	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: session }
	});
	if (!activeTeam) {
		return json({ success: false });
	}
	return json({
		success: true,
		data: {
			teamId: activeTeam.teamId,
			contestId: activeTeam.contestId
		}
	});
}) satisfies RequestHandler;
