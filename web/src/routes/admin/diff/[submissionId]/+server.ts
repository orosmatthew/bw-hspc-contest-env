import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { db } from '$lib/server/prisma';

const diffPostData = z.object({
	correct: z.boolean(),
	message: z.string()
});
export type DiffPostData = z.infer<typeof diffPostData>;

export const POST = (async ({ request, params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		throw error(400, 'Invalid submission');
	}
	const req = diffPostData.safeParse(await request.json());
	if (!req.success) {
		throw error(400, 'Invalid data format');
	}
	await db.submission.delete({ where: { id: submissionId } });
	return json({ success: true });
}) satisfies RequestHandler;
