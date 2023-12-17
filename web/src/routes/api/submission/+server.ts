import { db } from '$lib/server/prisma';
import { SubmissionState } from '@prisma/client';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import * as Diff from 'diff';

export const GET = (async () => {
	const submissions = await db.submission.findMany({
		where: { state: SubmissionState.Queued },
		orderBy: { createdAt: 'asc' },
		include: { problem: true, contest: true, team: true },
		take: 1
	});
	if (submissions.length !== 0) {
		return json({
			success: true,
			submission: {
				id: submissions[0].id,
				contestId: submissions[0].contest.id,
				contestName: submissions[0].contest.name,
				teamId: submissions[0].team.id,
				teamName: submissions[0].team.name,
				problem: {
					id: submissions[0].problemId,
					pascalName: submissions[0].problem.pascalName,
					realInput: submissions[0].problem.realInput
				},
				commitHash: submissions[0].commitHash
			}
		});
	} else {
		return json({ success: true, submission: null });
	}
}) satisfies RequestHandler;

const submissionPostData = z
	.object({
		submissionId: z.number(),
		output: z.string()
	})
	.strict();

export const POST = (async ({ request }) => {
	const data = submissionPostData.safeParse(await request.json());
	if (!data.success) {
		throw error(400);
	}
	const submission = await db.submission.findUnique({
		where: { id: data.data.submissionId },
		include: { problem: true }
	});
	if (!submission) {
		return json({ success: false });
	}
	if (submission.state !== SubmissionState.Queued) {
		return json({ success: false });
	}
	if (data.data.output.trimEnd() === submission.problem.realOutput.trimEnd()) {
		await db.submission.update({
			where: { id: data.data.submissionId },
			data: { state: SubmissionState.Correct, gradedAt: new Date(), actualOutput: data.data.output }
		});
		return json({ success: true });
	} else {
		const diff = Diff.createTwoFilesPatch(
			'expected',
			'actual',
			submission.problem.realOutput,
			data.data.output
		);
		await db.submission.update({
			where: { id: data.data.submissionId },
			data: { state: SubmissionState.InReview, diff: diff, actualOutput: data.data.output }
		});
		return json({ success: true });
	}
}) satisfies RequestHandler;
