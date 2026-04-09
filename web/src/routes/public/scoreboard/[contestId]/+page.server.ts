import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';
import { scoreboardService } from '$lib/server/services';
import { resolve } from '$app/paths';

export const load: PageServerLoad = async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	if (!contestIdParse.success) {
		redirect(307, resolve('/public/scoreboard'));
	}
	const scoreboard = await scoreboardService.getForContest(contestIdParse.data);
	if (scoreboard === undefined) {
		redirect(307, resolve('/public/scoreboard'));
	}
	return { scoreboard };
};
