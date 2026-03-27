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
import { problemRepo, submissionRepo, submissionSourceFileRepo } from '$lib/server/repos';
import {
	postSubmissionReqDto,
	type GetSubmissionResDto,
	type PostSubmissionResDto
} from 'bwcontest-shared/api/sandbox-types';

export const GET: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined || token !== env.WEB_SANDBOX_SECRET) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetSubmissionResDto, {
			status: 401
		});
	}
	const submission = await submissionRepo.getLatestQueued();
	if (submission === undefined) {
		return json({ success: true, data: null } satisfies GetSubmissionResDto);
	}
	const problem = await problemRepo.getByIdPrivate(submission.problemId);
	if (problem === undefined) {
		return json({ success: false, message: 'Problem is undefined' } satisfies GetSubmissionResDto, {
			status: 500
		});
	}
	return json({ success: true, data: { submission, problem } } satisfies GetSubmissionResDto);
};

export const POST: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined || token !== env.WEB_SANDBOX_SECRET) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostSubmissionResDto, {
			status: 401
		});
	}
	const req = postSubmissionReqDto.safeParse(await request.json());
	if (req.success !== true) {
		return json({ success: false, message: 'Invalid POST data' } satisfies PostSubmissionResDto, {
			status: 400
		});
	}
	const submission = await submissionRepo.getById(req.data.submissionId);
	if (submission === undefined) {
		return json(
			{ success: false, message: 'Submission not found' } satisfies PostSubmissionResDto,
			{ status: 404 }
		);
	}
	const problem = await problemRepo.getByIdPrivate(submission.problemId);
	if (problem === undefined) {
		return json({ success: false, message: 'Problem not found' } satisfies PostSubmissionResDto, {
			status: 404
		});
	}
	if (submission.state !== 'queued') {
		return json(
			{ success: false, message: 'Submission state is not queued' } satisfies PostSubmissionResDto,
			{ status: 400 }
		);
	}
	if (req.data.result.sourceFiles !== null) {
		for (const sourceFile of req.data.result.sourceFiles) {
			await submissionSourceFileRepo.create({
				pathFromRootProblem: sourceFile.pathFromProblemRoot,
				content: sourceFile.contest,
				submissionId: submission.id
			});
		}
	}
	const teamOutput =
		req.data.result.output !== null ? normalizeNewlines(req.data.result.output) : null;

	const testCaseResults =
		teamOutput !== null
			? (analyzeSubmissionOutput(problem, teamOutput)?.databaseString ?? 'Unknown')
			: null;

	console.log(`Sandbox got response, kind is ${req.data.result.kind}`);
	switch (req.data.result.kind) {
		case 'completed':
			if (autoJudgeResponse(problem.realOutput, teamOutput ?? '') === 'correct') {
				await submissionRepo.update(req.data.submissionId, {
					state: 'correct',
					gradedAt: new Date(),
					actualOutput: teamOutput,
					stateReason: null,
					stateReasonDetails: null,
					testCaseResults,
					exitCode: req.data.result.exitCode,
					runtimeMilliseconds: req.data.result.runtimeMilliseconds
				});
				return json({ success: true, data: undefined } satisfies PostSubmissionResDto);
			} else {
				const diff = Diff.createTwoFilesPatch(
					'expected',
					'actual',
					problem.realOutput,
					teamOutput ?? ''
				);
				await submissionRepo.update(req.data.submissionId, {
					state: 'in_review',
					diff,
					actualOutput: teamOutput,
					stateReason: null,
					stateReasonDetails: null,
					testCaseResults,
					exitCode: req.data.result.exitCode,
					runtimeMilliseconds: req.data.result.runtimeMilliseconds
				});
				return json({ success: true, data: undefined } satisfies PostSubmissionResDto);
			}
		case 'compileFailed':
			console.log('compile failed...');
			await submissionRepo.update(req.data.submissionId, {
				state: 'incorrect',
				gradedAt: new Date(),
				stateReason: 'build_error',
				stateReasonDetails: req.data.result.resultKindReason,
				message: 'Compilation Failed'
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionResDto);
		case 'timeLimitExceeded':
			await submissionRepo.update(req.data.submissionId, {
				state: 'incorrect',
				gradedAt: new Date(),
				actualOutput: teamOutput,
				stateReason: 'time_limit_exceeded',
				stateReasonDetails: req.data.result.resultKindReason,
				testCaseResults,
				exitCode: req.data.result.exitCode,
				runtimeMilliseconds: req.data.result.runtimeMilliseconds,
				message: 'Time Limit Exceeded'
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionResDto);
		case 'runError':
			// TODO: Raise to admins somehow. For now, just mark stateReason so it *could* be observed
			await submissionRepo.update(req.data.submissionId, {
				stateReason: 'sandbox_error',
				stateReasonDetails: req.data.result.resultKindReason
			});
			return json({ success: true, data: undefined } satisfies PostSubmissionResDto);
	}
};
