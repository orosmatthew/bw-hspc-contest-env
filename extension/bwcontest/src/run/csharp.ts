import * as fs from 'fs-extra';
import { join } from 'path';
import os = require('os');
import { spawn } from 'child_process';

import kill = require('tree-kill');

export async function runCSharp(
	srcDir: string,
	input: string,
	outputCallback: (data: string) => void,
	doneCallback: () => void
): Promise<(() => void) | undefined> {
	const tempDir = os.tmpdir();
	const buildDir = join(tempDir, 'bwcontest_csharp');
	if (await fs.exists(buildDir)) {
		await fs.remove(buildDir);
	}
	await fs.mkdir(buildDir);

	const child = spawn('dotnet run', { shell: true, cwd: srcDir });

	child.stdout.setEncoding('utf8');
	child.stdout.on('data', (data) => {
		outputCallback(data.toString());
	});
	child.stderr.setEncoding('utf8');
	child.stderr.on('data', (data) => {
		outputCallback(data.toString());
	});
	child.stdin.write(input);
	child.stdin.end();

	let done = false;

	child.on('close', () => {
		if (done === false) {
			done = true;
			doneCallback();
		}
	});

	setTimeout(() => {
		if (done === false) {
			console.log('\n[30 seconds reached, killing process...]');
			done = true;
			if (child.pid) {
				kill(child.pid);
			}
			outputCallback('\n[Timeout after 30 seconds]');
			doneCallback();
		}
	}, 30000);

	return () => {
		if (child.pid) {
			done = true;
			kill(child.pid);
			outputCallback('\n[Manually stopped]');
			doneCallback();
		}
	};
}
