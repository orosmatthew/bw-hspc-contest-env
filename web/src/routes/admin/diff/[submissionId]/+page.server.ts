import type { Actions, PageServerLoad } from './$types';
import * as Diff from 'diff';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';

export const load = (async ({ params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		throw error(400, 'Invalid request');
	}
	const submission = await db.submission.findUnique({ where: { id: submissionId } });
	if (!submission) {
		throw redirect(302, '/admin/reviews');
	}
	let diff = Diff.createTwoFilesPatch(
		'expected',
		'actual',
		submission.expectedOutput,
		submission.actualOutput
	);
	return { diff: diff };
}) satisfies PageServerLoad;

export const actions = {
	submit: async ({ request, params }) => {
		const submissionId = parseInt(params.submissionId);
		if (isNaN(submissionId)) {
			return { success: false };
		}
		const data = await request.formData();
		const correct = data.get('correct');
		if (!correct) {
			return { success: false };
		}
		const correctBool = correct.toString().toLowerCase() === 'true';
		await db.submission.delete({ where: { id: submissionId } });
		return { success: true };
	}
} satisfies Actions;
