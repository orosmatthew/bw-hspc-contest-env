import { extensionSettings } from './extension';
import * as fs from 'fs-extra';
import git from 'isomorphic-git';
import path = require('path');
import http from 'isomorphic-git/http/node';
import urlJoin from 'url-join';
import outputPanelLog from './outputPanelLog';
import type { SubmissionForExtension } from 'bwcontest-shared/types/contestMonitorTypes';

export async function submitProblem(
	sessionToken: string,
	contestId: number,
	teamId: number,
	problemId: number
): Promise<
	{ success: true; submission: SubmissionForExtension } | { success: false; message: string }
> {
	outputPanelLog.info(`Submitting problem id #{${problemId}}...`);

	let hash: string;
	let repoDir: string;

	try {
		const repoClonePath = extensionSettings().repoClonePath;

		repoDir = path.join(repoClonePath, 'BWContest', contestId.toString(), teamId.toString());
		await git.add({ fs, dir: repoDir, filepath: '.' });

		hash = await git.commit({
			fs,
			dir: repoDir,
			author: { name: `Team ${teamId}` },
			message: `Submit problem ${problemId}`
		});
	} catch (error) {
		outputPanelLog.error('Fail to make commit for submission: ' + JSON.stringify(error));
		throw error;
	}

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

	return { success: true, submission: resData.submission };
}
