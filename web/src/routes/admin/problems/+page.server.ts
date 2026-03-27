import { problemRepo } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const problems = await problemRepo.getAllPrivate();
	return { problems };
};
