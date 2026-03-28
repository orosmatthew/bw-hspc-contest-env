import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { scoreboardService } from '$lib/server/services';

export const load: PageServerLoad = async ({ locals }) => {
	const selectedContestId = locals.selectedContest;
	if (selectedContestId === null) {
		return { timestamp: new Date(), contest: null };
	}
	const scoreboard = await scoreboardService.getForContest(selectedContestId);
	if (scoreboard === undefined) {
		redirect(307, '/admin');
	}
	return scoreboard;
};
