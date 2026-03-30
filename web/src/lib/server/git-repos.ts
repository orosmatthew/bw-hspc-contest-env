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
	templateJavaProblem,
	templatePythonProblem
} from './templates';
import { problemRepo, teamRepo } from './repos';
import type { ProblemPrivate } from 'bwcontest-shared/types/problem';

type AddProblemsParams = {
	fs: memfs.IFs;
	dir: string;
	problems: Array<ProblemPrivate>;
};

async function addProblemsJava(params: AddProblemsParams) {
	params.problems.forEach((problem) => {
		params.fs.mkdirSync(join(params.dir, problem.pascalName));
		const filledTemplate = templateJavaProblem.replaceAll('%%pascalName%%', problem.pascalName);
		params.fs.writeFileSync(
			join(params.dir, problem.pascalName, `${problem.pascalName}.java`),
			filledTemplate
		);
	});
}

async function addProblemsCSharp(params: AddProblemsParams) {
	params.problems.forEach((problem) => {
		params.fs.mkdirSync(join(params.dir, problem.pascalName));
		params.fs.writeFileSync(
			join(params.dir, problem.pascalName, `${problem.pascalName}.csproj`),
			templateCSharpProblemProj
		);
		const filledTemplate = templateCSharpProblem.replaceAll('%%pascalName%%', problem.pascalName);
		params.fs.writeFileSync(
			join(params.dir, problem.pascalName, `${problem.pascalName}.cs`),
			filledTemplate
		);
	});
}

async function addProblemsCPP(params: AddProblemsParams) {
	let cmakeLists = templateCppCMakeLists;
	params.problems.forEach((problem) => {
		cmakeLists += `add_executable(${problem.pascalName} ${problem.pascalName}/${problem.pascalName}.cpp)\n`;
	});
	params.fs.writeFileSync(join(params.dir, 'CMakeLists.txt'), cmakeLists);

	params.fs.mkdirSync(join(params.dir, '.vscode'));
	params.fs.writeFileSync(join(params.dir, '.vscode', 'launch.json'), templateCppVscodeLaunch);
	params.fs.writeFileSync(join(params.dir, '.vscode', 'tasks.json'), templateCppVscodeTasks);

	params.problems.forEach((problem) => {
		params.fs.mkdirSync(join(params.dir, problem.pascalName));
		const filledTemplate = templateCppProblem.replaceAll('%%pascalName%%', problem.pascalName);
		params.fs.writeFileSync(
			join(params.dir, problem.pascalName, `${problem.pascalName}.cpp`),
			filledTemplate
		);
	});
}

async function addProblemsPython(params: AddProblemsParams) {
	params.problems.forEach((problem) => {
		params.fs.mkdirSync(join(params.dir, problem.pascalName));
		const filledTemplate = templatePythonProblem.replaceAll('%%pascalName%%', problem.pascalName);
		params.fs.writeFileSync(
			join(params.dir, problem.pascalName, `${problem.pascalName}.py`),
			filledTemplate
		);
	});
}

export async function createRepos(params: { contestId: number; teamIds: number[] }) {
	const vol = new memfs.Volume();
	const fs = createFsFromVolume(vol);

	const contestTeams = await teamRepo.getInContestPrivate(params.contestId);
	const contestProblems = await problemRepo.getInContestPrivate(params.contestId);

	contestTeams
		.filter((t) => params.teamIds.includes(t.id))
		.forEach(async (team) => {
			fs.mkdirSync(team.id.toString(), { recursive: true });
			await git.init({ fs: fs, bare: false, defaultBranch: 'main', dir: team.id.toString() });
			if (team.language === 'java') {
				await addProblemsJava({ fs, dir: team.id.toString(), problems: contestProblems });
			} else if (team.language === 'csharp') {
				await addProblemsCSharp({ fs, dir: team.id.toString(), problems: contestProblems });
				fs.writeFileSync(join(team.id.toString(), '.gitignore'), templateCSharpGitIgnore);
			} else if (team.language === 'cpp') {
				await addProblemsCPP({ fs, dir: team.id.toString(), problems: contestProblems });
				fs.writeFileSync(join(team.id.toString(), '.gitignore'), templateCppGitIgnore);
			} else if (team.language === 'python') {
				await addProblemsPython({ fs, dir: team.id.toString(), problems: contestProblems });
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
				}/${params.contestId.toString()}/${team.id.toString()}`
			});
		});
}
