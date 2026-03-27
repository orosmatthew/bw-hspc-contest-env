import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import z from 'zod';
import { problemRepo } from '$lib/server/repos';

export const DELETE: RequestHandler = async ({ params }) => {
	const problemIdParse = z.coerce.number().int().safeParse(params.problemId);
	if (!problemIdParse.success) {
		error(400, { message: 'Invalid problem id' });
	}
	const deleteSuccess = await problemRepo.delete(problemIdParse.data);
	if (!deleteSuccess) {
		return json({ success: false });
	}
	return json({ success: true });
};
