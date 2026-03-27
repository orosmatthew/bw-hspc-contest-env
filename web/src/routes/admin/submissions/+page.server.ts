import { contestRepo, problemRepo, submissionRepo } from '$lib/server/repos';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const selectedContestId = locals.selectedContest;
	if (selectedContestId === null) {
		return { timestamp: new Date() };
	}
	const contest = await contestRepo.getById(selectedContestId);
	if (contest === undefined) {
		error(404, { message: 'Contest not found' });
	}
	const contestProblems = await problemRepo.getInContestPrivate(contest.id);
	const submissions = await submissionRepo.getInContest(selectedContestId);
	return {
		timestamp: new Date(),
		contest,
		submissions,
		contestProblems
	};
};
