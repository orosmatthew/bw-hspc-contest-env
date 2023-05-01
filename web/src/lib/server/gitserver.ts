import { error } from 'console';
import { Git } from 'node-git-server';
import { join } from 'path';

let gitRunning = false;

export function startGitServer() {
	if (!gitRunning) {
		const port =
			!process.env.GIT_PORT || isNaN(parseInt(process.env.GIT_PORT))
				? 7006
				: parseInt(process.env.GIT_PORT);

		if (!process.env.GIT_REPO_DIR) {
			throw error('GIT_REPO_DIR not specified in .env');
		}
		const repoDir = process.env.GIT_REPO_DIR;

		const repos = new Git(join(repoDir), {
			autoCreate: false,
			authenticate: ({ type, user, repo }, next) => {
				if (type == 'push') {
					console.log(repo);
					user((username, password) => {
						console.log(username, password);
						next();
					});
				} else {
					next();
				}
			}
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
