import { z } from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { SubmissionState } from '@prisma/client';

const submissionPostData = z.object({
	state: z.nativeEnum(SubmissionState)
});
export type SubmissionPostData = z.infer<typeof submissionPostData>;

export const POST = (async ({ request }) => {
	return json({ success: true });
}) satisfies RequestHandler;
