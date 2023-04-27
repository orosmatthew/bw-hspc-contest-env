import type { PageServerLoad } from './$types';

export const load = (async () => {
	let reviewList = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
	return { reviewList: reviewList };
}) satisfies PageServerLoad;
