import { contestRepo } from '$lib/server/repos';
import type { Contest } from 'bwcontest-shared/types/contest';
import type { LayoutServerLoad } from './$types';
import z from 'zod';

export const load: LayoutServerLoad = async ({ params }) => {
	const contests = await contestRepo.getAll();
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	let contest: Contest | undefined;
	if (contestIdParse.success) {
		contest = await contestRepo.getById(contestIdParse.data);
	}
	return { contests, contest };
};
