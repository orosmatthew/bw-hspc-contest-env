import type { PageServerLoad } from './$types';
import * as Diff from 'diff';

export const load = (async () => {
	let diff = Diff.createTwoFilesPatch('data', 'data', 'abc', 'abd');
	return { diff: diff };
}) satisfies PageServerLoad;
