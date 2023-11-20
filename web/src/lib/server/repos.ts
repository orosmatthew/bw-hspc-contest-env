import { db } from '$lib/server/prisma';
import memfs, { createFsFromVolume } from 'memfs';
import { join } from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import {
	templateCSharpGitIgnore,
	templateCSharpProblem,
	templateCSharpProblemProj,
	templateJavaProblem
} from './templates';

type OptsAddProblems = {
	fs: memfs.IFs;
	dir: string;
	contest: { problems: { pascalName: string }[] };
};

async function addProblemsJava(opts: OptsAddProblems) {
	opts.contest.problems.forEach((problem) => {
		opts.fs.mkdirSync(join(opts.dir, problem.pascalName));
		const filledTemplate = templateJavaProblem.replaceAll('%%pascalName%%', problem.pascalName);
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.java`),
			filledTemplate
		);
	});
}

async function addProblemsCSharp(opts: OptsAddProblems) {
	opts.contest.problems.forEach((problem) => {
		opts.fs.mkdirSync(join(opts.dir, problem.pascalName));
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.csproj`),
			templateCSharpProblemProj
		);
		const filledTemplate = templateCSharpProblem.replaceAll('%%pascalName%%', problem.pascalName);
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

	contest.teams.forEach(async (team) => {
		fs.mkdirSync(team.id.toString(), { recursive: true });
		await git.init({ fs: fs, bare: false, defaultBranch: 'master', dir: team.id.toString() });
		if (team.language === 'Java') {
			addProblemsJava({ fs, dir: team.id.toString(), contest });
		} else if (team.language === 'CSharp') {
			addProblemsCSharp({ fs, dir: team.id.toString(), contest });
			fs.writeFileSync(join(team.id.toString(), '.gitignore'), templateCSharpGitIgnore);
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
			url: `http://127.0.0.1:${
				process.env.GIT_PORT ?? 7006
			}/${contest.id.toString()}/${team.id.toString()}`
		});
	});
}
