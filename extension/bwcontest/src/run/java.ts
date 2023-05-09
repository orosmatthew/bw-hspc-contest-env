import * as fs from 'fs-extra';
import { join } from 'path';
import os = require('os');
import { exec, spawn } from 'child_process';
import { extensionSettings } from '../extension';
import { error } from 'console';
import util = require('node:util');
import kill = require('tree-kill');

const execPromise = util.promisify(exec);

export async function runJava(
	srcDir: string,
	mainFile: string,
	mainClass: string,
	input: string
): Promise<{ output: Promise<string>; kill: Function | null }> {
	const javaPath = extensionSettings().javaPath;
	if (javaPath == '') {
		throw error('Java path not set');
	}
	const tempDir = os.tmpdir();
	const buildDir = join(tempDir, 'bwcontest_java');
	if (fs.existsSync(buildDir)) {
		fs.removeSync(buildDir);
	}
	fs.mkdirSync(buildDir);

	const compileCommand = `${join(javaPath, 'javac')} -cp ${srcDir} ${mainFile} -d ${buildDir}`;
	await execPromise(compileCommand);

	const runCommand = `${join(javaPath, 'java')} -cp "${buildDir}" ${mainClass}`;

	const child = spawn(runCommand, { shell: true });
	let outputBuffer = '';
	return {
		output: new Promise((resolve) => {
			child.stdout.setEncoding('utf8');
			child.stdout.on('data', (data) => {
				outputBuffer += data.toString();
			});
			child.stderr.setEncoding('utf8');
			child.stderr.on('data', (data) => {
				outputBuffer += data.toString();
			});
			child.stdin.write(input);
			child.stdin.end();

			let resolved = false;

			child.on('close', () => {
				if (!resolved) {
					resolved = true;
					resolve(outputBuffer);
				}
			});

			setTimeout(() => {
				if (!resolved) {
					console.log('30 seconds reached, killing process');
					resolved = true;
					child.kill('SIGKILL');
					resolve(outputBuffer + '\n[Timeout after 30 seconds]');
				}
			}, 30000);
		}),
		kill: () => {
			if (child.pid) {
				outputBuffer += '\n[Manually stopped]';
				kill(child.pid);
			}
		}
	};
}
