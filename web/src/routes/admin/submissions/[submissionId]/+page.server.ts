import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';

export const load = (async ({ params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		return error(400, 'Invalid submission');
	}
	const submission = await db.submission.findUnique({
		where: { id: submissionId },
		include: { sourceFiles: true, problem: true, contest: true }
	});
	if (!submission) {
		return redirect(302, '/admin/submissions');
	}
	const team = await db.team.findUnique({ where: { id: submission.teamId } });
	if (!team) {
		return error(500, 'Invalid team');
	}
	const problem = await db.problem.findUnique({ where: { id: submission.problemId } });
	if (!problem) {
		return error(500, 'Invalid problem');
	}

	const submissionHistory = await db.submission.findMany({
		where: {
			contestId: submission.contestId,
			problemId: submission.problemId,
			teamId: submission.teamId
		},
		orderBy: {
			createdAt: 'asc'
		}
	});

	return {
		id: submission.id,
		state: submission.state,
		stateReason: submission.stateReason,
		stateReasonDetails: submission.stateReasonDetails,
		teamName: team.name,
		expectedOutput: problem.realOutput,
		problemName: problem.friendlyName,
		submitTime: submission.createdAt,
		gradedTime: submission.gradedAt,
		message: submission.message,
		diff: submission.diff,
		output: submission.actualOutput,
		sourceFiles: submission.sourceFiles,
		submission: submission,
		contest: submission.contest,
		submissionHistory
	};
}) satisfies PageServerLoad;

export const actions = {
	delete: async ({ params }) => {
		const submissionId = parseInt(params.submissionId);
		try {
			await db.submission.delete({ where: { id: submissionId }, include: { sourceFiles: true } });
		} catch (error) {
			return { success: false, error: error?.toString() ?? '' };
		}
		redirect(302, '/admin/submissions');
	},
	submitGrade: async ({ request, params }) => {
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
				state: correctBool ? 'Correct' : 'Incorrect',
				stateReason: correctBool ? 'IncorrectOverriddenAsCorrect' : null,
				message: message ? message.toString() : '',
				gradedAt: gradedTime
			}
		});
		return { success: true };
	}
} satisfies Actions;
