import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';

export const load = (async ({ params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		error(400, 'Invalid submission');
	}
	const submission = await db.submission.findUnique({ where: { id: submissionId } });
	if (!submission) {
		redirect(302, '/admin/submissions');
	}
	const team = await db.team.findUnique({ where: { id: submission.teamId } });
	if (!team) {
		error(500, 'Invalid team');
	}
	const problem = await db.problem.findUnique({ where: { id: submission.problemId } });
	if (!problem) {
		error(500, 'Invalid problem');
	}
	return {
		id: submission.id,
		state: submission.state,
		stateReason: submission.stateReason,
		stateReasonDetails: submission.stateReasonDetails,
		teamName: team.name,
		problemName: problem.friendlyName,
		submitTime: submission.createdAt,
		gradedTime: submission.gradedAt,
		message: submission.message,
		diff: submission.diff,
		output: submission.actualOutput
	};
}) satisfies PageServerLoad;

export const actions = {
	delete: async ({ params }) => {
		const submissionId = parseInt(params.submissionId);
		try {
			await db.submission.delete({ where: { id: submissionId } });
		} catch {
			return { success: false };
		}
		redirect(302, '/admin/submissions');
	}
} satisfies Actions;
