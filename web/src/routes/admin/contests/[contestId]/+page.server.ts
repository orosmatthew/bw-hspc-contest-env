import { error, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/prisma';
import fs from 'fs-extra';
import { join } from 'path';
import { createRepos } from '$lib/server/repos';

export const load = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		error(400, 'Invalid request');
	}
	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { problems: true, teams: true, activeTeams: true }
	});
	if (!contest) {
		redirect(302, '/admin/contests');
	}
	return {
		name: contest.name,
		frozen: contest.freezeTime === null ? false : new Date() >= contest.freezeTime,
		problems: contest.problems.map((problem) => {
			return { id: problem.id, name: problem.friendlyName };
		}),
		teams: contest.teams.map((team) => {
			return { id: team.id, name: team.name };
		}),
		activeTeams: contest.activeTeams.length
	};
}) satisfies PageServerLoad;

export const actions = {
	delete: async ({ params }) => {
		if (!params.contestId || isNaN(parseInt(params.contestId))) {
			return { success: false, message: 'Invalid contest Id' };
		}
		try {
			await db.submission.deleteMany({ where: { contestId: parseInt(params.contestId) } });
			await db.contest.delete({ where: { id: parseInt(params.contestId) } });
		} catch (e) {
			console.error(e);
			return { success: false, message: `Database error: ${e}` };
		}
		redirect(302, '/admin/contests');
	},
	start: async ({ params }) => {
		if (!params.contestId) {
			return { success: false };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false };
		}
		const contest = await db.contest.findUnique({
			where: { id: contestId },
			include: { activeTeams: true, teams: { include: { activeTeam: true } } }
		});
		if (
			!contest ||
			contest.teams.length === 0 ||
			contest.activeTeams.length !== 0 ||
			contest.teams.find((team) => {
				return team.activeTeam;
			})
		) {
			return { success: false };
		}

		await db.submission.deleteMany({ where: { contestId: contest.id } });

		contest.teams.forEach(async (team) => {
			await db.activeTeam.create({ data: { teamId: team.id, contestId: contest.id } });
		});

		await db.contest.update({ where: { id: contestId }, data: { startTime: new Date() } });

		return { success: true };
	},
	stop: async ({ params }) => {
		if (!params.contestId) {
			return { success: false };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false };
		}
		const contest = await db.contest.findUnique({
			where: { id: contestId },
			include: { activeTeams: true }
		});
		if (!contest || contest.activeTeams.length === 0) {
			return { success: false };
		}
		contest.activeTeams.forEach(async (activeTeam) => {
			await db.activeTeam.delete({ where: { id: activeTeam.id } });
		});
		return { success: true };
	},
	repo: async ({ params, request }) => {
		if (!params.contestId) {
			return { success: false };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false };
		}
		const form = await request.formData();
		const formEntries = Array.from(form.entries());
		const resetTeamIds = formEntries
			.filter((e) => e[0].startsWith('teamId'))
			.map((e) => {
				return parseInt(e[1].toString());
			});
		resetTeamIds.forEach((teamId) => {
			const repoPath = join('repo', contestId.toString(), `${teamId.toString()}.git`);
			if (fs.existsSync(repoPath) === true) {
				fs.removeSync(repoPath);
			}
		});
		await createRepos(contestId, resetTeamIds);
		return { success: true };
	},
	freeze: async ({ params }) => {
		if (!params.contestId) {
			return { success: false, message: 'No contest Id specified' };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false, message: 'Invalid contest Id' };
		}
		const contest = await db.contest.findUnique({ where: { id: contestId } });
		if (contest === null) {
			return { success: false, message: 'Invalid contest' };
		}
		try {
			await db.contest.update({ where: { id: contestId }, data: { freezeTime: new Date() } });
		} catch (e) {
			console.error(`Database error: ${e}`);
			return { success: false, message: `Database error: ${e}` };
		}
		return { success: true };
	},
	unfreeze: async ({ params }) => {
		if (!params.contestId) {
			return { success: false, message: 'No contest Id specified' };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false, message: 'Invalid contest Id' };
		}
		const contest = await db.contest.findUnique({ where: { id: contestId } });
		if (contest === null) {
			return { success: false, message: 'Invalid contest' };
		}
		try {
			await db.contest.update({ where: { id: contestId }, data: { freezeTime: null } });
		} catch (e) {
			console.error(`Database error: ${e}`);
			return { success: false, message: `Database error: ${e}` };
		}
		return { success: true };
	}
} satisfies Actions;
