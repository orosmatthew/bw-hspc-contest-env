import { contestRepo, problemRepo, teamRepo } from '$lib/server/repos';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { stringToJsonSchema } from '$lib/common/utils';
import { createRepos } from '$lib/server/git-repos';

export const load: PageServerLoad = async () => {
	const teams = await teamRepo.getAll({ forPublic: false });
	const problems = await problemRepo.getAll({ forPublic: false });
	return { teams, problems };
};

const createSchema = z.object({
	name: z.string().min(1),
	teamIds: stringToJsonSchema.pipe(z.array(z.number().int())),
	problemIds: stringToJsonSchema.pipe(z.array(z.number().int()))
});

export const actions: Actions = {
	create: async ({ request }) => {
		const form = createSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const contestId = await contestRepo.create({
			name: form.data.name,
			startTime: null,
			freezeTime: null
		});
		if (contestId === undefined) {
			return { success: false, message: 'Unable to create contest' };
		}
		const assignTeamsSuccess = await contestRepo.assignTeamIds(contestId, form.data.teamIds);
		if (assignTeamsSuccess !== true) {
			return { success: false, message: 'Unable to assign teams to contest' };
		}
		const assignProblemsSuccess = await contestRepo.assignProblemIds(
			contestId,
			form.data.problemIds
		);
		if (assignProblemsSuccess !== true) {
			return { success: false, message: 'Unable to assign problems to contest' };
		}
		await createRepos({ contestId: contestId, teamIds: form.data.teamIds });
		return { success: true };
	}
};
