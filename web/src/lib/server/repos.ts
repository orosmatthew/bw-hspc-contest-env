import { db } from '$lib/server/prisma';
import memfs, { createFsFromVolume } from 'memfs';
import { join } from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { env } from '$env/dynamic/private';
import {
	templateCSharpGitIgnore,
	templateCSharpProblem,
	templateCSharpProblemProj,
	templateCppCMakeLists,
	templateCppGitIgnore,
	templateCppProblem,
	templateCppVscodeLaunch,
	templateCppVscodeTasks,
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

async function addProblemsCPP(opts: OptsAddProblems) {
	let cmakeLists = templateCppCMakeLists;
	opts.contest.problems.forEach((problem) => {
		cmakeLists += `add_executable(${problem.pascalName} ${problem.pascalName}/${problem.pascalName}.cpp)\n`;
	});
	opts.fs.writeFileSync(join(opts.dir, 'CMakeLists.txt'), cmakeLists);

	opts.fs.mkdirSync(join(opts.dir, '.vscode'));
	opts.fs.writeFileSync(join(opts.dir, '.vscode', 'launch.json'), templateCppVscodeLaunch);
	opts.fs.writeFileSync(join(opts.dir, '.vscode', 'tasks.json'), templateCppVscodeTasks);

	opts.contest.problems.forEach((problem) => {
		opts.fs.mkdirSync(join(opts.dir, problem.pascalName));
		const filledTemplate = templateCppProblem.replaceAll('%%pascalName%%', problem.pascalName);
		opts.fs.writeFileSync(
			join(opts.dir, problem.pascalName, `${problem.pascalName}.cpp`),
			filledTemplate
		);
	});
}

export async function createRepos(contestId: number, teamIds: number[]) {
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

	contest.teams
		.filter((t) => teamIds.includes(t.id))
		.forEach(async (team) => {
			fs.mkdirSync(team.id.toString(), { recursive: true });
			await git.init({ fs: fs, bare: false, defaultBranch: 'master', dir: team.id.toString() });
			if (team.language === 'Java') {
				addProblemsJava({ fs, dir: team.id.toString(), contest });
			} else if (team.language === 'CSharp') {
				addProblemsCSharp({ fs, dir: team.id.toString(), contest });
				fs.writeFileSync(join(team.id.toString(), '.gitignore'), templateCSharpGitIgnore);
			} else if (team.language === 'CPP') {
				addProblemsCPP({ fs, dir: team.id.toString(), contest });
				fs.writeFileSync(join(team.id.toString(), '.gitignore'), templateCppGitIgnore);
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
					env.GIT_PORT ?? 7006
				}/${contest.id.toString()}/${team.id.toString()}`
			});
		});
}
