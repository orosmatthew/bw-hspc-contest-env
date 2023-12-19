import { z } from 'zod';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

const logoutPostData = z
	.object({
		token: z.string()
	})
	.strict();

export const POST = (async ({ request }) => {
	const data = logoutPostData.safeParse(await request.json());
	if (!data.success) {
		error(400);
	}
	await db.activeTeam.update({
		where: { sessionToken: data.data.token },
		data: { sessionToken: null, sessionCreatedAt: null }
	});
	return json({ success: true });
}) satisfies RequestHandler;
