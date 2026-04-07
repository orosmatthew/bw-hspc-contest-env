import { createFsFromVolume, Volume, type IFs } from 'memfs';
import { problemRepo, teamRepo } from '../repos';
import git from 'isomorphic-git';
import { type ProblemPrivate } from 'bwcontest-shared/types/problem';
import { join } from 'path';
import {
	templateCppCMakeLists,
	templateCppProblem,
	templateCppVscodeLaunch,
	templateCppVscodeTasks,
	templateCSharpProblem,
	templateCSharpProblemProj,
	templateJavaProblem,
	templatePythonProblem
} from '$lib/data/templates';
import http from 'isomorphic-git/http/node';
import { env } from '$env/dynamic/private';

type AddProblemsParams = {
	fs: IFs;
	dir: string;
	problems: Array<ProblemPrivate>;
};

export class GitRepoService {
	public async createRepos(params: { contestId: number; teamIds: Array<number> }): Promise<void> {
		const vol = new Volume();
		const fs = createFsFromVolume(vol);

		const teams = (await teamRepo.getInContestPrivate(params.contestId)).filter((t) =>
			params.teamIds.includes(t.id)
		);
		const problems = await problemRepo.getInContestPrivate(params.contestId);

		for (const team of teams) {
			fs.mkdirSync(team.id.toString(), { recursive: true });
			await git.init({ fs, bare: false, defaultBranch: 'main', dir: team.id.toString() });
			switch (team.language) {
				case 'java':
					this._addProblemsJava({ fs, dir: team.id.toString(), problems });
					break;
				case 'csharp':
					this._addProblemsCSharp({ fs, dir: team.id.toString(), problems });
					break;
				case 'cpp':
					this._addProblemsCpp({ fs, dir: team.id.toString(), problems });
					break;
				case 'python':
					this._addProblemsPython({ fs, dir: team.id.toString(), problems });
					break;
				default:
					console.error(`Language not supported: ${team.language}`);
					continue;
			}
			await git.add({ fs, dir: team.id.toString(), filepath: '.' });
			await git.commit({
				fs,
				dir: team.id.toString(),
				message: 'Initial',
				author: { name: 'Admin' },
			});
			await git.push({
				fs,
				http,
				dir: team.id.toString(),
				url: `http://127.0.0.1:${env.GIT_PORT ?? 7006}/${params.contestId.toString()}/${team.id.toString()}`
			});
		}
	}

	private _addProblemsJava(params: AddProblemsParams): void {
		for (const problem of params.problems) {
			params.fs.mkdirSync(join(params.dir, problem.pascalName));
			const filledTemplate = templateJavaProblem.replaceAll('%%pascalName%%', problem.pascalName);
			params.fs.writeFileSync(
				join(params.dir, problem.pascalName, `${problem.pascalName}.java`),
				filledTemplate
			);
		}
	}

	private _addProblemsCSharp(params: AddProblemsParams): void {
		for (const problem of params.problems) {
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
		}
	}

	private _addProblemsCpp(params: AddProblemsParams): void {
		let cmakeLists = templateCppCMakeLists;
		for (const problem of params.problems) {
			cmakeLists += `add_executable(${problem.pascalName} ${problem.pascalName}/${problem.pascalName}.cpp)\n`;
		}
		params.fs.writeFileSync(join(params.dir, 'CMakeLists.txt'), cmakeLists);
		params.fs.mkdirSync(join(params.dir, '.vscode'));
		params.fs.writeFileSync(join(params.dir, '.vscode', 'launch.json'), templateCppVscodeLaunch);
		params.fs.writeFileSync(join(params.dir, '.vscode', 'tasks.json'), templateCppVscodeTasks);
		for (const problem of params.problems) {
			params.fs.mkdirSync(join(params.dir, problem.pascalName));
			const filledTemplate = templateCppProblem.replaceAll('%%pascalName%%', problem.pascalName);
			params.fs.writeFileSync(
				join(params.dir, problem.pascalName, `${problem.pascalName}.cpp`),
				filledTemplate
			);
		}
	}

	private _addProblemsPython(params: AddProblemsParams): void {
		for (const problem of params.problems) {
			params.fs.mkdirSync(join(params.dir, problem.pascalName));
			const filledTemplate = templatePythonProblem.replaceAll('%%pascalName%%', problem.pascalName);
			params.fs.writeFileSync(
				join(params.dir, problem.pascalName, `${problem.pascalName}.py`),
				filledTemplate
			);
		}
	}
}
