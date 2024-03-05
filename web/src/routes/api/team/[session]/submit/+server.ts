import { db } from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { SubmissionState } from '@prisma/client';
import type { SubmissionForExtension } from '$lib/contestMonitor/contestMonitorSharedTypes';
import { convertSubmissionStateForExtension } from '$lib/contestMonitor/contestMonitorUtils';

const submitPostData = z.object({
	commitHash: z.string(),
	problemId: z.number()
});

export const POST = (async ({ params, request }) => {
	const sessionToken = params.session;
	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: sessionToken },
		include: {
			contest: { include: { problems: { select: { id: true } } } },
			team: { include: { submissions: true } }
		}
	});
	if (!activeTeam) {
		error(400);
	}
	const data = submitPostData.safeParse(await request.json());
	if (!data.success) {
		error(400);
	}

	if (
		!activeTeam.contest.problems.find((problem) => {
			return problem.id == data.data.problemId;
		})
	) {
		error(400);
	}

	// Make sure no submission is currently marked correct
	const correctSubmissions = activeTeam.team.submissions.filter((submission) => {
		return (
			submission.contestId === activeTeam.contestId &&
			submission.state === 'Correct' &&
			submission.problemId === data.data.problemId
		);
	}).length;

	if (correctSubmissions !== 0) {
		return json({ success: false, message: 'Already submitted correct submission' });
	}

	const submission = await db.submission.create({
		data: {
			state: SubmissionState.Queued,
			commitHash: data.data.commitHash,
			teamId: activeTeam.teamId,
			problemId: data.data.problemId,
			contestId: activeTeam.contestId
		}
	});

	const submissionForExtension: SubmissionForExtension = {
		id: submission.id,
		contestId: submission.contestId,
		teamId: submission.teamId,
		problemId: submission.problemId,
		createdAt: submission.createdAt,
		state: convertSubmissionStateForExtension(submission.state),
		message: submission.message
	};

	return json({ success: true, submission: submissionForExtension });
}) satisfies RequestHandler;
