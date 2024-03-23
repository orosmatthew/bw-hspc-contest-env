import { db } from '$lib/server/prisma';
import { SubmissionState, SubmissionStateReason } from '@prisma/client';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import * as Diff from 'diff';

export const GET = (async ({ request }) => {
	const secret = request.headers.get('secret');
	if (secret === null || secret !== process.env.WEB_SANDBOX_SECRET!) {
		throw error(401, 'Unauthorized');
	}
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
				teamLanguage: submissions[0].team.language,
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

export const POST = (async ({ request }) => {
	const secret = request.headers.get('secret');
	if (secret === null || secret !== process.env.WEB_SANDBOX_SECRET!) {
		throw error(401, 'Unauthorized');
	}
	const requestJson = await request.json();
	const data = submissionPostData.safeParse(requestJson);
	if (!data.success) {
		console.log(
			'Error: POST to Submission API failed to parse given object: ' + JSON.stringify(requestJson)
		);
		error(400);
	}

	const submission = await db.submission.findUnique({
		where: { id: data.data.submissionId },
		include: { problem: true }
	});

	if (!submission) {
		console.log(
			'Error: POST to Submission API for unknown submissionId: ' + data.data.submissionId
		);
		return json({ success: false });
	}

	if (submission.state !== SubmissionState.Queued) {
		console.log(
			'Error: POST to Submission API for already judged submissionId: ' + data.data.submissionId
		);
		return json({ success: false });
	}

	if (data.data.result.sourceFiles && data.data.result.sourceFiles.length > 0) {
		for (const sourceFile of data.data.result.sourceFiles) {
			await db.submissionSourceFile.create({
				data: { pathFromProblemRoot: sourceFile.pathFromProblemRoot, content: sourceFile.content,
				submissionId: submission.id }
			});
		}
	}

	switch (data.data.result.kind) {
		case 'Completed':
			if (data.data.result.output!.trimEnd() === submission.problem.realOutput.trimEnd()) {
				await db.submission.update({
					where: { id: data.data.submissionId },
					data: {
						state: SubmissionState.Correct,
						gradedAt: new Date(),
						actualOutput: data.data.result.output,
						stateReason: null,
						stateReasonDetails: null,
						exitCode: data.data.result.exitCode,
						runtimeMilliseconds: data.data.result.runtimeMilliseconds
					}
				});
				return json({ success: true });
			} else {
				const diff = Diff.createTwoFilesPatch(
					'expected',
					'actual',
					submission.problem.realOutput,
					data.data.result.output!
				);
				await db.submission.update({
					where: { id: data.data.submissionId },
					data: {
						state: SubmissionState.InReview,
						diff: diff,
						actualOutput: data.data.result.output,
						stateReason: null,
						stateReasonDetails: null,
						exitCode: data.data.result.exitCode,
						runtimeMilliseconds: data.data.result.runtimeMilliseconds
					}
				});
				return json({ success: true });
			}

		case 'CompileFailed':
			console.log('compile failed...');
			await db.submission.update({
				where: { id: data.data.submissionId },
				data: {
					state: SubmissionState.Incorrect,
					gradedAt: new Date(),
					stateReason: SubmissionStateReason.BuildError,
					stateReasonDetails: data.data.result.resultKindReason,
					message: 'Compilation Failed'
				}
			});
			return json({ success: true });

		case 'TimeLimitExceeded':
			await db.submission.update({
				where: { id: data.data.submissionId },
				data: {
					state: SubmissionState.Incorrect,
					gradedAt: new Date(),
					actualOutput: data.data.result.output,
					stateReason: SubmissionStateReason.TimeLimitExceeded,
					stateReasonDetails: data.data.result.resultKindReason,
					exitCode: data.data.result.exitCode,
					runtimeMilliseconds: data.data.result.runtimeMilliseconds
				}
			});
			return json({ success: true });

		case 'RunError':
			// TODO: Raise to admins somehow. For now, just mark stateReason so it *could* be observed
			await db.submission.update({
				where: { id: data.data.submissionId },
				data: {
					stateReason: SubmissionStateReason.SandboxError,
					stateReasonDetails: data.data.result.resultKindReason
				}
			});
			return json({ success: true });
	}
}) satisfies RequestHandler;

// Copy/paste these zod definitions from the shared project because referencing 
// the shared one results in "RollupError: Expected '{', got 'type'"

const RunResultKind = z.enum([
	'CompileFailed',
	'TimeLimitExceeded',
	'Completed',
	'RunError'
]);

const SourceFileWithTextZod = z
	.object({
		pathFromProblemRoot: z.string(),
		content: z.string(),
	})
	.strict();

const RunResultZod = z
	.object({
		kind: RunResultKind,
		output: z.string().optional(),
		exitCode: z.number().optional(),
		runtimeMilliseconds: z.number().optional(),
		resultKindReason: z.string().optional(),
		sourceFiles: z.array(SourceFileWithTextZod).optional()
	})
	.strict();

const submissionPostData = z
	.object({
		submissionId: z.number(),
		result: RunResultZod
	})
	.strict();