import fs from 'fs-extra';
import { join } from 'path';
import os from 'os';
import { exec, spawn } from 'child_process';
import { error } from 'console';
import util from 'util';

const execPromise = util.promisify(exec);

export async function runJava(
	srcDir: string,
	mainFile: string,
	mainClass: string,
	input: string
): Promise<string> {
	const javaPath = '';
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

	return new Promise((resolve) => {
		let outputBuffer = '';
		const child = spawn(runCommand, { shell: true });
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

		child.on('close', () => {
			resolve(outputBuffer);
		});
	});
}
