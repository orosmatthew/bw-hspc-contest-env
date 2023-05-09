import { extensionSettings } from './extension';
import { exec } from 'child_process';
import util = require('node:util');
import axios from 'axios';

const execPromise = util.promisify(exec);

export async function submitProblem(
	sessionToken: string,
	contestId: number,
	teamId: number,
	problemId: number
) {
	const repoClonePath = extensionSettings().repoClonePath;
	console.log(repoClonePath);

	const clonedRepoPath = `${repoClonePath}/BWContest/${contestId.toString()}/${teamId.toString()}`;

	let output: { stdout: string; stderr: string };
	output = await execPromise(`git add .`, {
		cwd: clonedRepoPath
	});

	if (output.stderr) {
		console.error(output.stderr);
	}

	output = await execPromise(`git commit -m "Submit problem ${problemId}"`, {
		cwd: clonedRepoPath
	});

	if (output.stderr) {
		console.error(output.stderr);
	}

	output = await execPromise(`git push`, {
		cwd: clonedRepoPath
	});

	if (output.stderr) {
		console.error(output.stderr);
	}

	output = await execPromise(`git rev-parse HEAD`, {
		cwd: clonedRepoPath
	});

	if (output.stderr) {
		console.error(output.stderr);
	}

	const commitHash = output.stdout.toString().replace('\n', '');
	const res = await axios.post(`http://localhost:5173/api/team/${sessionToken}/submit`, {
		commitHash: commitHash,
		problemId: problemId
	});
	if (res.status !== 200) {
		throw Error('Failed to post submission');
	}
	if (!res.data.success) {
		throw Error(res.data.message ?? 'Unknown error');
	}
}
