import { env } from '$env/dynamic/private';
import z from 'zod';
import { Git } from 'node-git-server';
import { join } from 'path';

export class GitServerService {
	private _running = false;
	private _server: Git | undefined;

	public start() {
		if (this._running) {
			return;
		}
		const portParse = z.coerce.number().int().safeParse(env.GIT_PORT);
		const port = portParse.success ? portParse.data : 7006;
		const repoDir = 'repo';
		this._server = new Git(join(repoDir), { autoCreate: true });
		this._server.on('push', (push) => {
			console.log(`[GitServerService] push ${push.repo}/${push.commit} (${push.branch})`);
			push.accept();
		});
		this._server.on('fetch', (fetch) => {
			console.log(`[GitServerService] fetch ${fetch.commit}`);
			fetch.accept();
		});
		this._server.listen(port, { type: 'http' }, () => {
			console.log(`[GitServerService] Running on port ${port}`);
			this._running = true;
		});
	}

	public async stop(): Promise<void> {
		await this._server?.close();
		this._running = false;
	}
}
