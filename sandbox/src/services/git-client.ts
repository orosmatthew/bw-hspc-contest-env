import os from 'os';
import { join } from 'path';
import fs from 'fs-extra';
import urlJoin from 'url-join';
import { SubmissionPrivate } from 'bwcontest-shared/types/submission';
import { simpleGit } from 'simple-git';

export class GitClient {
	private _baseUrl: string;

	public constructor(params: { baseUrl: string }) {
		this._baseUrl = params.baseUrl;
	}

	public async cloneAndCheckoutSubmission(
		submission: SubmissionPrivate
	): Promise<{ repoDir: string }> {
		const tmpDir = os.tmpdir();
		const repoDir = join(tmpDir, 'bwcontest-src');
		if (await fs.exists(repoDir)) {
			await fs.remove(repoDir);
		}
		await fs.mkdir(repoDir);
		const teamRepoUrl = urlJoin(
			this._baseUrl,
			submission.contestId.toString(),
			submission.teamId.toString() + '.git'
		);
		console.log(`- CLONE: from ${teamRepoUrl}`);
		const client = simpleGit({ baseDir: repoDir });
		await client.clone(teamRepoUrl, '.');
		await client.checkout(submission.commitHash);
		return { repoDir };
	}
}
