import { z } from 'zod';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

const logoutPostData = z
	.object({
		token: z.string(),
		teamId: z.number()
	})
	.strict();

export const POST = (async ({ request }) => {
	const data = logoutPostData.safeParse(await request.json());
	if (!data.success) {
		error(400);
	}

	const activeTeam = await db.activeTeam.findUnique({
		where: { teamId: data.data.teamId }
	});

	if (!activeTeam) {
		return json({
			success: true,
			message: 'No active team found with the provided teamId. Client should log out.'
		});
	}

	if (activeTeam.sessionToken !== data.data.token) {
		return json({
			success: true,
			message: 'Active team found, but provided sessionToken is incorrect.  Client should log out.'
		});
	}

	try {
		await db.activeTeam.update({
			where: { sessionToken: data.data.token },
			data: { sessionToken: null, sessionCreatedAt: null }
		});
	} catch (error) {
		console.error(error);
		return json({
			success: true,
			message:
				"Active team found with correct sessionToken, but couldn't clear it out. Client should still log out."
		});
	}

	return json({ success: true });
}) satisfies RequestHandler;
