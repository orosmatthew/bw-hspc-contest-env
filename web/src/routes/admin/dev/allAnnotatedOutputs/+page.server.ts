import { problemRepo, submissionRepo } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const submissions = await submissionRepo.getAllPrivate();
	const problems = await problemRepo.getAllPrivate();
	return { submissions, problems };
};
