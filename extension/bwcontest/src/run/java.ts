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
	input: string,
	outputCallback: (data: string) => void,
	doneCallback: () => void
): Promise<(() => void) | undefined> {
	const javaPath = extensionSettings().javaPath;
	if (javaPath == '') {
		throw error('Java path not set');
	}
	const tempDir = os.tmpdir();
	const buildDir = join(tempDir, 'bwcontest_java');
	if (await fs.exists(buildDir)) {
		await fs.remove(buildDir);
	}
	await fs.mkdir(buildDir);

	const compileCommand = `${join(javaPath, 'javac')} -cp ${srcDir} ${mainFile} -d ${buildDir}`;
	try {
		await execPromise(compileCommand);
	} catch (error) {
		outputCallback('[Compile Error]\n\n');
		outputCallback(String(error));
		return;
	}

	const runCommand = `${join(javaPath, 'java')} -cp "${buildDir}" ${mainClass}`;

	const child = spawn(runCommand, { shell: true });

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
