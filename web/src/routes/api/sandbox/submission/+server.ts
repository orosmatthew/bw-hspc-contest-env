import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Diff from 'diff';
import { env } from '$env/dynamic/private';
import { normalizeNewlines } from '$lib/common/output-analyzer/analyzer-utils';
import {
	analyzeSubmissionOutput,
	autoJudgeResponse
} from '$lib/common/output-analyzer/output-analyzer';
import { getBearerToken } from '$lib/common/utils';
import { problemRepo, submissionRepo, submissionSourceFileRepo, teamRepo } from '$lib/server/repos';
import {
	postSubmissionReqSchema,
	type GetSubmissionRes,
	type PostSubmissionRes
} from 'bwcontest-shared/types/api/sandbox';

export const GET: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined || token !== env.SANDBOX_SECRET) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetSubmissionRes, {
			status: 401
		});
	}
	const submission = await submissionRepo.getNextQueuedPrivate();
	if (submission === undefined) {
		return json({ success: true, data: null } satisfies GetSubmissionRes);
	}
	const problem = await problemRepo.getByIdPrivate(submission.problemId);
	if (problem === undefined) {
		return json({ success: false, message: 'Problem is undefined' } satisfies GetSubmissionRes, {
			status: 500
		});
	}
	const team = await teamRepo.getByIdPrivate(submission.teamId);
	if (team === undefined) {
		return json({ success: false, message: 'Team is undefined' } satisfies GetSubmissionRes, {
			status: 500
		});
	}
	return json({ success: true, data: { submission, problem, team } } satisfies GetSubmissionRes);
};

export const POST: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined || token !== env.SANDBOX_SECRET) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostSubmissionRes, {
			status: 401
		});
	}
	const req = postSubmissionReqSchema.safeParse(await request.json());
	if (req.success !== true) {
		return json({ success: false, message: 'Invalid POST data' } satisfies PostSubmissionRes, {
			status: 400
		});
	}
	const submission = await submissionRepo.getByIdPrivate(req.data.submissionId);
	if (submission === undefined) {
		return json({ success: false, message: 'Submission not found' } satisfies PostSubmissionRes, {
			status: 404
		});
	}
	const problem = await problemRepo.getByIdPrivate(submission.problemId);
	if (problem === undefined) {
		return json({ success: false, message: 'Problem not found' } satisfies PostSubmissionRes, {
			status: 404
		});
	}
	if (submission.state !== 'queued') {
		return json(
			{ success: false, message: 'Submission state is not queued' } satisfies PostSubmissionRes,
			{ status: 400 }
		);
	}
	if (req.data.result.sourceFiles !== undefined) {
		await submissionSourceFileRepo.createMany(
			req.data.result.sourceFiles.map((s) => ({
				submissionId: submission.id,
				pathFromProblemRoot: s.pathFromProblemRoot,
				content: s.content
			}))
		);
	}
	const teamOutput =
		req.data.result.output !== undefined ? normalizeNewlines(req.data.result.output) : null;

	const testCaseResults =
		teamOutput !== null
			? (analyzeSubmissionOutput(problem, teamOutput)?.databaseString ?? 'Unknown')
			: null;

	console.log(`Sandbox got response, kind is ${req.data.result.kind}`);
	switch (req.data.result.kind) {
		case 'completed':
			if (autoJudgeResponse(problem.realOutput, teamOutput ?? '') === 'correct') {
				await submissionRepo.updateById(req.data.submissionId, {
					state: 'correct',
					gradedAt: new Date(),
					actualOutput: teamOutput,
					stateReason: null,
					stateReasonDetails: null,
					testCaseResults,
					exitCode: req.data.result.exitCode,
					runtimeMilliseconds: req.data.result.runtimeMilliseconds
				});
				return json({ success: true, data: undefined } satisfies PostSubmissionRes);
			} else {
				const diff = Diff.createTwoFilesPatch(
					'expected',
					'actual',
					problem.realOutput,
					teamOutput ?? ''
				);
				await submissionRepo.updateById(req.data.submissionId, {
					state: 'inReview',
					diff,
					actualOutput: teamOutput,
					stateReason: null,
					stateReasonDetails: null,
					testCaseResults,
					exitCode: req.data.result.exitCode,
					runtimeMilliseconds: req.data.result.runtimeMilliseconds
				});
				return json({ success: true, data: undefined } satisfies PostSubmissionRes);
			}
		case 'compileFailed':
			console.log('compile failed...');
			await submissionRepo.updateById(req.data.submissionId, {
				state: 'incorrect',
				gradedAt: new Date(),
				stateReason: 'buildError',
				stateReasonDetails: req.data.result.resultKindReason,
				message: 'Compilation Failed'
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionRes);
		case 'timeLimitExceeded':
			await submissionRepo.updateById(req.data.submissionId, {
				state: 'incorrect',
				gradedAt: new Date(),
				actualOutput: teamOutput,
				stateReason: 'timeLimitExceeded',
				stateReasonDetails: req.data.result.resultKindReason,
				testCaseResults,
				exitCode: req.data.result.exitCode,
				runtimeMilliseconds: req.data.result.runtimeMilliseconds,
				message: 'Time Limit Exceeded'
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionRes);
		case 'runError':
			// TODO: Raise to admins somehow. For now, just mark stateReason so it *could* be observed
			await submissionRepo.updateById(req.data.submissionId, {
				stateReason: 'sandboxError',
				stateReasonDetails: req.data.result.resultKindReason
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionRes);
	}
};
