import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const diffPostData = z.object({
	correct: z.boolean(),
	message: z.string()
});
export type DiffPostData = z.infer<typeof diffPostData>;

export const POST = (async ({ request }) => {
	const req = diffPostData.safeParse(await request.json());
	if (!req.success) {
		throw error(400, 'Invalid data format');
	}
	console.log(req.data.correct);
	console.log(req.data.message);
	return json({ success: true });
}) satisfies RequestHandler;
