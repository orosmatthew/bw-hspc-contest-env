import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	postSubmissionReqDtoSchema,
	type PostSubmissionResDto
} from 'bwcontest-shared/api/client-types';
import { getBearerToken } from '$lib/common/utils';
import { activeTeamRepo, problemRepo, submissionRepo } from '$lib/server/repos';

export const POST: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostSubmissionResDto, {
			status: 401
		});
	}
	const activeTeam = await activeTeamRepo.getBySessionTokenPrivate(token);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostSubmissionResDto, {
			status: 401
		});
	}
	const req = postSubmissionReqDtoSchema.safeParse(await request.json());
	if (req.success !== true) {
		return json({ success: false, message: 'Invalid POST data' } satisfies PostSubmissionResDto, {
			status: 400
		});
	}
	const problem = await problemRepo.getByIdPrivate(req.data.problemId);
	if (problem === undefined) {
		return json({ success: false, message: 'Problem not found' } satisfies PostSubmissionResDto, {
			status: 404
		});
	}
	const submissions = await submissionRepo.getInContestForTeamForProblem(
		activeTeam.contestId,
		activeTeam.teamId,
		problem.id
	);
	if (submissions.some((s) => s.state === 'correct')) {
		return json(
			{
				success: false,
				message: 'Already submitted correct submission'
			} satisfies PostSubmissionResDto,
			{ status: 400 }
		);
	}
	const id = await submissionRepo.create({
		state: 'correct',
		commitHash: req.data.commitHash,
		teamId: activeTeam.teamId,
		problemId: problem.id,
		contestId: activeTeam.contestId,
		actualOutput: null,
		createdAt: new Date(),
		diff: null,
		exitCode: null,
		gradedAt: null,
		message: null,
		runtimeMilliseconds: null,
		stateReason: null,
		stateReasonDetails: null,
		testCaseResults: null
	});
	if (id === undefined) {
		return json(
			{ success: false, message: 'Unable to create submission' } satisfies PostSubmissionResDto,
			{ status: 500 }
		);
	}
	const submission = await submissionRepo.getById(id);
	if (submission === undefined) {
		return json(
			{ success: false, message: 'Submission is undefined' } satisfies PostSubmissionResDto,
			{ status: 500 }
		);
	}
	return json({ success: true, data: { submission } } satisfies PostSubmissionResDto);
};
