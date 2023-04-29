import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/prisma';

export const DELETE = (async ({ params }) => {
	const problemId = parseInt(params.problemId);
	if (isNaN(problemId)) {
		throw error(400, 'Invalid problem');
	}
	await db.problem.delete({ where: { id: problemId } });
	return json({ success: true });
}) satisfies RequestHandler;
