import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';
import Diff from 'diff';
import { SubmissionState } from '@prisma/client';

export const load = (async ({ params }) => {
	const submissionId = parseInt(params.submissionId);
	if (isNaN(submissionId)) {
		throw error(400, 'Invalid submission');
	}
	const submission = await db.submission.findUnique({ where: { id: submissionId } });
	if (!submission) {
		throw redirect(302, '/admin/submissions');
	}
	const team = await db.team.findUnique({ where: { id: submission.teamId } });
	if (!team) {
		throw error(500, 'Invalid team');
	}
	const problem = await db.problem.findUnique({ where: { id: submission.problemId } });
	if (!problem) {
		throw error(500, 'Invalid problem');
	}
	let diff: string | null = null;
	if (submission.state == SubmissionState.Incorrect) {
		diff = Diff.createTwoFilesPatch(
			'expected',
			'actual',
			problem.realOutput,
			submission.actualOutput
		);
	}

	return {
		id: submission.id,
		state: submission.state,
		teamName: team.name,
		problemName: problem.friendlyName,
		submitTime: submission.createdAt,
		gradedTime: submission.gradedAt,
		message: submission.message,
		diff: diff
	};
}) satisfies PageServerLoad;
