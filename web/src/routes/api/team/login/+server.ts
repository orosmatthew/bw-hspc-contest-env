import { z } from 'zod';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';
import * as UUID from 'uuid';

const loginPostData = z
	.object({
		teamname: z.string(),
		password: z.string()
	})
	.strict();

export const POST = (async ({ request }) => {
	const data = loginPostData.safeParse(await request.json());
	if (!data.success) {
		error(400);
	}
	const team = await db.team.findUnique({
		where: { name: data.data.teamname },
		include: { activeTeam: true }
	});

	if (!team) {
		return json({ success: false, message: 'Invalid team' });
	}

	if (team.password !== data.data.password) {
		return json({ success: false, message: 'Invalid password' });
	}

	if (!team.activeTeam) {
		return json({ success: false, message: 'No active contest for team' });
	}

	const activeTeam = await db.activeTeam.update({
		where: { id: team.activeTeam.id },
		data: { sessionToken: UUID.v4(), sessionCreatedAt: new Date() }
	});

	return json({ success: true, token: activeTeam.sessionToken });
}) satisfies RequestHandler;
