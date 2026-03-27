import { contestRepo } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const contests = await contestRepo.getAll();
	return { contests };
}) satisfies PageServerLoad;
