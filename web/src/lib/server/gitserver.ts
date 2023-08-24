import { Git } from 'node-git-server';
import { join } from 'path';

let gitRunning = false;

export let repos: Git;

export function startGitServer() {
	if (!gitRunning) {
		const port =
			!process.env.GIT_PORT || isNaN(parseInt(process.env.GIT_PORT))
				? 7006
				: parseInt(process.env.GIT_PORT);

		const repoDir = 'repo';

		repos = new Git(join(repoDir), {
			autoCreate: true
		});

		repos.on('push', (push) => {
			console.log(`push ${push.repo}/${push.commit} ( ${push.branch} )`);
			push.accept();
		});

		repos.on('fetch', (fetch) => {
			console.log(`fetch ${fetch.commit}`);
			fetch.accept();
		});

		repos.listen(port, { type: 'http' }, () => {
			console.log(`node-git-server running at http://localhost:${port}`);
			gitRunning = true;
		});
	}
}
