import type { SubmissionPublic } from 'bwcontest-shared/types/submission';
import { outputPanelLog } from '../common/output-panel-log';
import { apiClient, extensionService } from '.';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs-extra';

export class SubmitService {
	async submitProblem(params: {
		token: string;
		contestId: number;
		teamId: number;
		problemId: number;
	}): Promise<
		{ success: true; submission: SubmissionPublic } | { success: false; message: string }
	> {
		outputPanelLog.info(`Submitting problem id #{${params.problemId}}...`);

		let hash: string;
		let repoDir: string;

		try {
			const repoClonePath = extensionService.getSettings().repoClonePath;
			repoDir = path.join(
				repoClonePath,
				'BWContest',
				params.contestId.toString(),
				params.teamId.toString()
			);
			await git.add({ fs, dir: repoDir, filepath: '.' });

			hash = await git.commit({
				fs,
				dir: repoDir,
				author: { name: `Team ${params.teamId}` },
				message: `Submit problem ${params.problemId}`
			});
		} catch (e) {
			outputPanelLog.error(`Fail to make commit for submission: ${JSON.stringify(e)}`);
			throw e;
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
		} catch (e) {
			outputPanelLog.error(String(e));
			return { success: false, message: 'Unable to push' };
		}

		const postRes = await apiClient.postSubmission({
			commitHash: hash,
			problemId: params.problemId
		});

		if (postRes === undefined || postRes.success !== true) {
			return {
				success: false,
				message: `Submission POST failure: ${postRes?.message ?? 'unknown'}`
			};
		}
		return { success: true, submission: postRes.data.submission };
	}
}
