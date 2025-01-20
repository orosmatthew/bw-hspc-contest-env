import { db } from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import * as Diff from 'diff';
import { analyzeSubmissionOutput, autoJudgeResponse } from '$lib/outputAnalyzer/outputAnalyzer';
import { normalizeNewlines } from '$lib/outputAnalyzer/analyzerUtils';

export const GET = (async ({ request }) => {
	const secret = request.headers.get('secret');
	if (process.env.WEB_SANDBOX_SECRET === undefined) {
		throw new Error('Environment WEB_SANDBOX_SECRET is undefined');
	}
	if (secret === null || secret !== process.env.WEB_SANDBOX_SECRET) {
		throw error(401, 'Unauthorized');
	}
	const submissions = await db.submission.findMany({
		where: { state: 'Queued' },
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
	if (process.env.WEB_SANDBOX_SECRET === undefined) {
		throw new Error('Environment WEB_SANDBOX_SECRET is undefined');
	}
	if (secret === null || secret !== process.env.WEB_SANDBOX_SECRET) {
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

	if (submission.state !== 'Queued') {
		console.log(
			'Error: POST to Submission API for already judged submissionId: ' + data.data.submissionId
		);
		return json({ success: false });
	}

	if (data.data.result.sourceFiles && data.data.result.sourceFiles.length > 0) {
		for (const sourceFile of data.data.result.sourceFiles) {
			await db.submissionSourceFile.create({
				data: {
					pathFromProblemRoot: sourceFile.pathFromProblemRoot,
					content: sourceFile.content,
					submissionId: submission.id
				}
			});
		}
	}

	const teamOutput =
		data.data.result.output != undefined ? normalizeNewlines(data.data.result.output) : null;

	const testCaseResults =
		teamOutput != null
			? (analyzeSubmissionOutput(submission.problem, teamOutput)?.databaseString ?? 'Unknown')
			: null;

	console.log(`Sandbox got response, kind is ${data.data.result.kind}`);
	switch (data.data.result.kind) {
		case 'Completed':
			if (autoJudgeResponse(submission.problem.realOutput, teamOutput ?? '') == 'Correct') {
				await db.submission.update({
					where: { id: data.data.submissionId },
					data: {
						state: 'Correct',
						gradedAt: new Date(),
						actualOutput: teamOutput,
						stateReason: null,
						stateReasonDetails: null,
						testCaseResults,
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
					teamOutput ?? ''
				);
				await db.submission.update({
					where: { id: data.data.submissionId },
					data: {
						state: 'InReview',
						diff: diff,
						actualOutput: teamOutput,
						stateReason: null,
						stateReasonDetails: null,
						testCaseResults,
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
					state: 'Incorrect',
					gradedAt: new Date(),
					stateReason: 'BuildError',
					stateReasonDetails: data.data.result.resultKindReason,
					message: 'Compilation Failed'
				}
			});
			return json({ success: true });

		case 'TimeLimitExceeded':
			await db.submission.update({
				where: { id: data.data.submissionId },
				data: {
					state: 'Incorrect',
					gradedAt: new Date(),
					actualOutput: teamOutput,
					stateReason: 'TimeLimitExceeded',
					stateReasonDetails: data.data.result.resultKindReason,
					testCaseResults,
					exitCode: data.data.result.exitCode,
					runtimeMilliseconds: data.data.result.runtimeMilliseconds,
					message: 'Time Limit Exceeded'
				}
			});
			return json({ success: true });

		case 'RunError':
			// TODO: Raise to admins somehow. For now, just mark stateReason so it *could* be observed
			await db.submission.update({
				where: { id: data.data.submissionId },
				data: {
					stateReason: 'SandboxError',
					stateReasonDetails: data.data.result.resultKindReason
				}
			});
			return json({ success: true });
	}
}) satisfies RequestHandler;

// Copy/paste these zod definitions from the shared project because referencing
// the shared one results in "RollupError: Expected '{', got 'type'"

const RunResultKind = z.enum(['CompileFailed', 'TimeLimitExceeded', 'Completed', 'RunError']);

const SourceFileWithTextZod = z
	.object({
		pathFromProblemRoot: z.string(),
		content: z.string()
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
