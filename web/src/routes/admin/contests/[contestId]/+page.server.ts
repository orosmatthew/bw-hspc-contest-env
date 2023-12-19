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
		if (!params.contestId) {
			return { success: false };
		}
		try {
			await db.contest.delete({ where: { id: parseInt(params.contestId) } });
		} catch {
			return { success: false };
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
	repo: async ({ params }) => {
		if (!params.contestId) {
			return { success: false };
		}
		const contestId = parseInt(params.contestId);
		if (isNaN(contestId)) {
			return { success: false };
		}
		if (fs.existsSync(join('repo', contestId.toString()))) {
			fs.removeSync(join('repo', contestId.toString()));
		}
		await createRepos(contestId);
		return { success: true };
	}
} satisfies Actions;
