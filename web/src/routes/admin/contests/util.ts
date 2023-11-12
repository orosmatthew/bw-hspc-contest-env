import { db } from '$lib/server/prisma';
import hostFs from 'fs-extra';
import memfs, { createFsFromVolume } from 'memfs';
import { join } from 'path';
import git from 'isomorphic-git';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'isomorphic-git/http/node';

async function addProblemsJava(opts: {
	fs: memfs.IFs;
	templateDir: string;
	dir: string;
	contest: { problems: { pascalName: string }[] };
}) {
	const template = hostFs
		.readFileSync(join(opts.templateDir, 'java/problem/problem.java'))
		.toString();

	opts.contest.problems.forEach((problem) => {
		opts.fs.mkdirSync(join(opts.dir, problem.pascalName));
		const filledTemplate = template.replaceAll('%%pascalName%%', problem.pascalName);
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.java`),
			filledTemplate
		);
	});
}

async function addProblemsCSharp(opts: {
	fs: memfs.IFs;
	templateDir: string;
	dir: string;
	contest: { problems: { pascalName: string }[] };
}) {
	const project = hostFs
		.readFileSync(join(opts.templateDir, 'csharp/problem/problem.csproj'))
		.toString();
	const template = hostFs
		.readFileSync(join(opts.templateDir, 'csharp/problem/problem.cs'))
		.toString();
	opts.contest.problems.forEach((problem) => {
		opts.fs.mkdirSync(join(opts.dir, problem.pascalName));
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.csproj`),
			project
		);
		const filledTemplate = template.replaceAll('%%pascalName%%', problem.pascalName);
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.cs`),
			filledTemplate
		);
	});
}

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

	contest.teams.forEach(async (team) => {
		fs.mkdirSync(team.id.toString(), { recursive: true });
		await git.init({ fs: fs, bare: false, defaultBranch: 'master', dir: team.id.toString() });
		if (team.language === 'Java') {
			addProblemsJava({ fs, templateDir, dir: team.id.toString(), contest });
		} else if (team.language === 'CSharp') {
			addProblemsCSharp({ fs, templateDir, dir: team.id.toString(), contest });
			const gitignore = hostFs.readFileSync(join(templateDir, 'csharp/.gitignore')).toString();
			fs.writeFileSync(join(team.id.toString(), '.gitignore'), gitignore);
		} else {
			console.error('Language not supported');
			return;
		}
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
