import { normalizeNewlines } from '$lib/common/output-analyzer/analyzer-utils';
import { problemRepo } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const problems = await problemRepo.getAllPrivate();
	return { problems };
};

export const actions = {
	fixProblemNewlines: async () => {
		try {
			const problems = await problemRepo.getAllPrivate();
			for (const problem of problems) {
				await problemRepo.updateInputOutputs(problem.id, {
					sampleInput: normalizeNewlines(problem.sampleInput),
					sampleOutput: normalizeNewlines(problem.sampleOutput),
					realInput: normalizeNewlines(problem.realInput),
					realOutput: normalizeNewlines(problem.realOutput)
				});
			}
			return { success: true };
		} catch (err) {
			return { success: false, errorMessage: err?.toString() ?? 'error' };
		}
	}
};
