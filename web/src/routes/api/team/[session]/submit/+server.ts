import { db } from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { SubmissionState } from '@prisma/client';

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
		throw error(400);
	}
	const data = submitPostData.safeParse(await request.json());
	if (!data.success) {
		throw error(400);
	}

	if (
		!activeTeam.contest.problems.find((problem) => {
			return problem.id == data.data.problemId;
		})
	) {
		throw error(400);
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

	await db.submission.create({
		data: {
			state: SubmissionState.Queued,
			commitHash: data.data.commitHash,
			teamId: activeTeam.teamId,
			problemId: data.data.problemId,
			contestId: activeTeam.contestId
		}
	});

	return json({ success: true });
}) satisfies RequestHandler;
