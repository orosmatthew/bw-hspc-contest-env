import { db } from '$lib/server/prisma';
import { join } from 'path';
import type { Actions, PageServerLoad } from './$types';
import fs from 'fs';
import { error } from 'console';
import { repos } from '$lib/server/gitserver';

export const load = (async () => {
	const teams = await db.team.findMany();
	const problems = await db.problem.findMany();
	return {
		teams: teams.map((row) => {
			return { id: row.id, name: row.name };
		}),
		problems: problems.map((row) => {
			return { id: row.id, name: row.friendlyName };
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	create: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get('name');
		const problems = (await db.problem.findMany()).filter((problem) => {
			return data.get('problem_' + problem.id) !== null;
		});
		const teams = (await db.team.findMany()).filter((team) => {
			return data.get('team_' + team.id) !== null;
		});
		if (!name) {
			return { success: false };
		}
		const createdContest = await db.contest.create({
			data: {
				name: name.toString(),
				teams: {
					connect: teams.map((team) => {
						return { id: team.id };
					})
				},
				problems: {
					connect: problems.map((problem) => {
						return { id: problem.id };
					})
				}
			},
			include: { teams: true }
		});

		// Create repos

		const repoDir = process.env.GIT_REPO_DIR;
		if (!repoDir) {
			throw error(500, 'No repo directory specified in env');
		}

		if (fs.existsSync(join(repoDir, createdContest.id.toString()))) {
			fs.rmdirSync(join(repoDir, createdContest.id.toString()), { recursive: true });
		}

		createdContest.teams.forEach((team) => {
			repos.create(join(createdContest.id.toString(), team.id.toString()), (e) => {
				if (e) {
					throw error(500, `Unable to create repo for team: ${team.name}: ${e.message}`);
				}
			});
		});

		return { success: true };
	}
} satisfies Actions;
