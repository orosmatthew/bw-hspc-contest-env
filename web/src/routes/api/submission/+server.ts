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
		include: { problem: true },
		take: 1
	});
	if (submissions.length !== 0) {
		return json({
			success: true,
			submission: {
				id: submissions[0].id,
				contestId: submissions[0].contestId,
				teamId: submissions[0].teamId,
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
	const submission = await db.submission.update({
		where: { id: data.data.submissionId },
		data: { actualOutput: data.data.output },
		include: { problem: true }
	});
	if (data.data.output.trimEnd() === submission.problem.realOutput.trimEnd()) {
		await db.submission.update({
			where: { id: data.data.submissionId },
			data: { state: SubmissionState.Correct, gradedAt: new Date() }
		});
		return json({ success: true });
	} else {
		const diff = Diff.createTwoFilesPatch(
			'expected',
			'actual',
			data.data.output,
			submission.actualOutput!
		);
		await db.submission.update({
			where: { id: data.data.submissionId },
			data: { state: SubmissionState.InReview, diff: diff }
		});
		return json({ success: true });
	}
}) satisfies RequestHandler;
