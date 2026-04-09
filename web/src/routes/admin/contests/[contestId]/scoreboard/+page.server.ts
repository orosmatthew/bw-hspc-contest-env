import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { scoreboardService } from '$lib/server/services';
import { resolve } from '$app/paths';

export const load: PageServerLoad = async ({ parent }) => {
	const { contest } = await parent();
	if (contest === undefined) {
		error(404, { message: 'Contest not found' });
	}
	if (contest.startTime === null) {
		return { message: 'Contest not started' };
	}
	const scoreboard = await scoreboardService.getForContest(contest.id);
	if (scoreboard === undefined) {
		redirect(307, resolve('/admin'));
	}
	return { scoreboard };
};
