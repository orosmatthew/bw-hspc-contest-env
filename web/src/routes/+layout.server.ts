import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	return { theme: locals.theme };
}) satisfies LayoutServerLoad;
