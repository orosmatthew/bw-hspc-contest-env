import z from 'zod';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { submissionRepo } from '$lib/server/repos';

export const load: PageServerLoad = async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	const teamIdParse = z.coerce.number().int().safeParse(params.teamId);
	const problemIdParse = z.coerce.number().int().safeParse(params.problemId);
	if (!contestIdParse.success || !teamIdParse.success || !problemIdParse.success) {
		error(400, { message: 'Invalid params' });
	}
	const submissions = await submissionRepo.getInContestForTeamForProblemPrivate(
		contestIdParse.data,
		teamIdParse.data,
		problemIdParse.data
	);
	if (submissions.length === 0) {
		error(404, 'No submissions found');
	}
	const lastSubmission = submissions[submissions.length - 1];
	redirect(307, `/admin/submissions/${lastSubmission.id}`);
};
