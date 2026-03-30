import z from 'zod';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { submissionRepo } from '$lib/server/repos';
import urlJoin from 'url-join';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { contest } = await parent();
	if (contest === undefined) {
		error(404, { message: 'Contest not found' });
	}
	const teamIdParse = z.coerce.number().int().safeParse(params.teamId);
	const problemIdParse = z.coerce.number().int().safeParse(params.problemId);
	if (!teamIdParse.success || !problemIdParse.success) {
		error(400, { message: 'Invalid params' });
	}
	const submissions = await submissionRepo.getInContestForTeamForProblemPrivate(
		contest.id,
		teamIdParse.data,
		problemIdParse.data
	);
	if (submissions.length === 0) {
		error(404, 'No submissions found');
	}
	const lastSubmission = submissions[submissions.length - 1];
	redirect(
		307,
		urlJoin('/admin/contests', contest.id.toString(), '/submissions', lastSubmission.id.toString())
	);
};
