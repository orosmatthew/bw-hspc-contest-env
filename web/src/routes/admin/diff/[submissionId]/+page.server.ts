import type { Actions, PageServerLoad } from './$types';
import * as Diff from 'diff';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';

export const load = (async ({ params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		throw error(400, 'Invalid request');
	}
	const submission = await db.submission.findUnique({ where: { id: submissionId } });
	if (!submission) {
		throw redirect(302, '/admin/reviews');
	}
	const problem = await db.problem.findUnique({ where: { id: submission.problemId } });
	if (!problem) {
		throw error(500, 'Invalid problem');
	}
	let diff = Diff.createTwoFilesPatch(
		'expected',
		'actual',
		problem.realOutput,
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
		const message = data.get('message');
		if (!correct) {
			return { success: false };
		}
		const correctBool = correct.toString().toLowerCase() === 'true';
		const gradedTime = new Date();
		await db.submission.update({
			where: { id: submissionId },
			data: {
				state: correctBool ? SubmissionState.Correct : SubmissionState.Incorrect,
				message: message ? message.toString() : '',
				gradedAt: gradedTime
			}
		});
		return { success: true };
	}
} satisfies Actions;
