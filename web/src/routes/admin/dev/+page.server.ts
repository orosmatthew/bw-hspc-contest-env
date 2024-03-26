import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { normalizeNewlines } from '$lib/outputAnalyzer/analyzerUtils';

export const load = (async () => {
	const problems = await db.problem.findMany();
	return { problems };
}) satisfies PageServerLoad;

export const actions = {
	fixProblemNewlines: async () => {
		try {
			const problems = await db.problem.findMany();
			for (const problem of problems) {
				await db.problem.update({
					where: { id: problem.id },
					data: {
						sampleInput: normalizeNewlines(problem.sampleInput),
						sampleOutput: normalizeNewlines(problem.sampleOutput),
						realInput: normalizeNewlines(problem.realInput),
						realOutput: normalizeNewlines(problem.realOutput)
					}
				});
			}

			return { success: true };
		} catch (err) {
			return { success: false, errorMessage: err?.toString() ?? 'error' };
		}
	}
};
