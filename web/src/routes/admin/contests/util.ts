import { db } from '$lib/server/prisma';
import hostFs from 'fs-extra';
import memfs, { createFsFromVolume } from 'memfs';
import { join } from 'path';
import git from 'isomorphic-git';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'isomorphic-git/http/node';

export async function createRepos(contestId: number) {
	const vol = new memfs.Volume();
	const fs = createFsFromVolume(vol);

	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { teams: true, problems: true }
	});
	if (contest === null) {
		console.error('Invalid contest');
		return;
	}

	const templateDir = join(dirname(fileURLToPath(import.meta.url)), '../../../../templates');

	const template = hostFs.readFileSync(join(templateDir, 'java/problem/Main.java')).toString();

	contest.teams.forEach(async (team) => {
		fs.mkdirSync(team.id.toString(), { recursive: true });
		await git.init({ fs: fs, bare: false, defaultBranch: 'master', dir: team.id.toString() });
		contest.problems.forEach((problem) => {
			fs.mkdirSync(join(team.id.toString(), problem.pascalName));
			const filledTemplate = template.replaceAll('%%pascalName%%', problem.pascalName);
			fs.writeFileSync(
				join(team.id.toString(), problem.pascalName, `${problem.pascalName}.java`),
				filledTemplate
			);
		});
		await git.add({ fs: fs, dir: team.id.toString(), filepath: '.' });
		await git.commit({
			fs: fs,
			dir: team.id.toString(),
			message: 'Initial',
			author: { name: 'Admin' }
		});
		await git.push({
			fs: fs,
			http,
			dir: team.id.toString(),
			url: `http://localhost:${process.env.GIT_PORT}/${contest.id.toString()}/${team.id.toString()}`
		});
	});
}
