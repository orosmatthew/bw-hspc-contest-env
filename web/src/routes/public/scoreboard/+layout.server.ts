import { contestRepo } from '$lib/server/repos';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const contests = await contestRepo.getAll();
	return { contests };
};
