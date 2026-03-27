import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import fs from 'fs-extra';
import { join } from 'path';
import z from 'zod';
import {
	activeTeamRepo,
	contestRepo,
	problemRepo,
	submissionRepo,
	teamRepo
} from '$lib/server/repos';
import { stringToJsonSchema } from '$lib/common/utils';
import { createRepos } from '$lib/server/git-repos';

export const load: PageServerLoad = async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	if (!contestIdParse.success) {
		error(400, 'Invalid contest id');
	}
	const contest = await contestRepo.getById(contestIdParse.data);
	if (contest === undefined) {
		redirect(307, '/admin/contests');
	}
	const problems = await problemRepo.getInContestPrivate(contest.id);
	const teams = await teamRepo.getInContestPrivate(contest.id);
	return {
		contest,
		problems,
		teams,
		activeTeamsCount: await activeTeamRepo.getCountInContest(contest.id)
	};
};

const repoSchema = z.object({
	teamIds: stringToJsonSchema.pipe(z.array(z.number().int()))
});

export const actions: Actions = {
	delete: async ({ params }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const submissionDeleteSuccess = await submissionRepo.deleteInContest(contestIdParse.data);
		if (submissionDeleteSuccess !== true) {
			return { success: false, message: 'Unable to delete contest submissions' };
		}
		const contestDeleteSuccess = await contestRepo.deleteById(contestIdParse.data);
		if (contestDeleteSuccess !== true) {
			return { success: false, message: 'Unable to delete contest' };
		}
		redirect(303, '/admin/contests');
	},
	start: async ({ params }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const contest = await contestRepo.getById(contestIdParse.data);
		if (contest === undefined) {
			return { success: false, message: 'Contest not found' };
		}
		const contestTeams = await teamRepo.getInContestPrivate(contest.id);
		const activeTeamsCount = await activeTeamRepo.getCountInContest(contest.id);
		if (contestTeams.length === 0) {
			return { success: false, message: 'Contest has no teams' };
		}
		if (activeTeamsCount !== 0) {
			return { success: false, message: 'Active teams are associated with this contest' };
		}
		if (contestTeams.some((t) => t.hasActiveTeam) === true) {
			return { success: false, message: 'A team assigned to the contest is already active' };
		}
		const submissionDeleteSuccess = await submissionRepo.deleteInContest(contestIdParse.data);
		if (submissionDeleteSuccess !== true) {
			return { success: false, message: 'Unable to delete previous submissions' };
		}
		const activeTeamCreateResult = await activeTeamRepo.createMany(
			contestTeams.map((t) => ({ contestId: contestIdParse.data, teamId: t.id }))
		);
		if (activeTeamCreateResult !== true) {
			return { success: false, message: 'Unable to create active teams' };
		}
		const updateStartTimeSuccess = await contestRepo.updateStartTime(
			contestIdParse.data,
			new Date()
		);
		if (updateStartTimeSuccess !== true) {
			return { success: false, message: 'Unable to update contest start time' };
		}
		return { success: true };
	},
	stop: async ({ params }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const contest = await contestRepo.getById(contestIdParse.data);
		if (contest === undefined) {
			return { success: false, message: 'Contest not found' };
		}
		const activeTeamDeleteSuccess = await activeTeamRepo.deleteInContest(contest.id);
		if (activeTeamDeleteSuccess !== true) {
			return { success: false, message: 'Unable to delete active teams' };
		}
		return { success: true };
	},
	repo: async ({ params, request }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const contest = await contestRepo.getById(contestIdParse.data);
		if (contest === undefined) {
			return { success: false, message: 'Contest not found' };
		}
		const form = repoSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		for (const teamId of form.data.teamIds) {
			const repoPath = join('repo', contest.id.toString(), `${teamId.toString()}.git`);
			await fs.remove(repoPath);
		}
		await createRepos({ contestId: contest.id, teamIds: form.data.teamIds });
		return { success: true };
	},
	freeze: async ({ params }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const updateSuccess = await contestRepo.updateFreezeTime(contestIdParse.data, new Date());
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update freeze time' };
		}
		return { success: true };
	},
	unfreeze: async ({ params }) => {
		const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
		if (!contestIdParse.success) {
			return { success: false, message: 'Invalid contest id' };
		}
		const updateSuccess = await contestRepo.updateFreezeTime(contestIdParse.data, null);
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update freeze time' };
		}
		return { success: true };
	}
};
