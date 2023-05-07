import { db } from '$lib/server/prisma';
import path, { join } from 'path';
import type { Actions, PageServerLoad } from './$types';
import fs from 'fs';
import { simpleGit } from 'simple-git';
import { createRepos } from '../util';

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

function copyFolderSync(source: string, target: string) {
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target);
	}

	fs.readdirSync(source).forEach((file) => {
		const sourcePath = path.join(source, file);
		const targetPath = path.join(target, file);

		if (fs.lstatSync(sourcePath).isDirectory()) {
			copyFolderSync(sourcePath, targetPath);
		} else {
			fs.copyFileSync(sourcePath, targetPath);
		}
	});
}
export const actions = {
	create: async ({ request }) => {
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
			include: { teams: true, problems: true }
		});

		await createRepos(createdContest.id);

		return { success: true };
	}
} satisfies Actions;
