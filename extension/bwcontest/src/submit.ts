import { extensionSettings } from './extension';
import * as fs from 'fs-extra';
import git from 'isomorphic-git';
import path = require('path');
import http from 'isomorphic-git/http/node';
import urlJoin from 'url-join';

export async function submitProblem(
	sessionToken: string,
	contestId: number,
	teamId: number,
	problemId: number
): Promise<{ success: true } | { success: false; message: string }> {
	const repoClonePath = extensionSettings().repoClonePath;

	const repoDir = path.join(repoClonePath, 'BWContest', contestId.toString(), teamId.toString());
	await git.add({ fs, dir: repoDir, filepath: '.' });

	const hash = await git.commit({
		fs,
		dir: repoDir,
		author: { name: `Team ${teamId}` },
		message: `Submit problem ${problemId}`
	});

	try {
		const result = await git.push({
			fs,
			http,
			dir: repoDir
		});
		if (result.ok !== true) {
			return { success: false, message: 'Push failure' };
		}
	} catch (error) {
		return { success: false, message: 'Unable to push' };
	}

	const res = await fetch(
		urlJoin(extensionSettings().webUrl, '/api/team', sessionToken, '/submit'),
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				commitHash: hash,
				problemId: problemId
			})
		}
	);
	if (res.status !== 200) {
		return { success: false, message: 'Submission POST failure' };
	}
	const resData = await res.json();
	if (resData.success !== true) {
		return { success: false, message: resData.message };
	}
	return { success: true };
}
