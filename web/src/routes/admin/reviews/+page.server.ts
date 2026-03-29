import { contestRepo, problemRepo, submissionRepo } from '$lib/server/repos';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const selectedContestId = locals.selectedContest;
	if (selectedContestId === null) {
		return {
			timestamp: new Date(),
			reviewList: null,
			queueList: null
		};
	}
	const contest = await contestRepo.getById(selectedContestId);
	if (contest === undefined) {
		error(404, { message: 'Contest not found' });
	}
	const reviewList = await submissionRepo.getInContestWithStatePrivate(
		selectedContestId,
		'inReview'
	);
	const queueList = await submissionRepo.getInContestWithStatePrivate(selectedContestId, 'queued');
	const contestProblems = await problemRepo.getInContestPrivate(selectedContestId);
	return {
		timestamp: new Date(),
		contest,
		reviewList,
		queueList,
		contestProblems
	};
};
