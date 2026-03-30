import { problemRepo, submissionRepo } from '$lib/server/repos';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { contest } = await parent();
	if (contest === undefined) {
		error(404, { message: 'Contest not found' });
	}
	const reviewList = await submissionRepo.getInContestWithStatePrivate(contest.id, 'inReview');
	const queueList = await submissionRepo.getInContestWithStatePrivate(contest.id, 'queued');
	const contestProblems = await problemRepo.getInContestPrivate(contest.id);
	return {
		timestamp: new Date(),
		contest,
		reviewList,
		queueList,
		contestProblems
	};
};
