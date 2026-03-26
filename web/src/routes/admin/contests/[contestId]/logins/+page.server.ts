import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';
import { contestRepo, teamRepo } from '$lib/server/repos';

export const load: PageServerLoad = async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	if (!contestIdParse.success) {
		redirect(307, '/admin/contests');
	}
	const contest = await contestRepo.getById(contestIdParse.data);
	if (contest === undefined) {
		redirect(307, '/admin/contests');
	}
	const teams = await teamRepo.getInContest(contest.id, { forPublic: false });
	return { teams };
};
