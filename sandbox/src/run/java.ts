import { join } from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';
import { RunResult, RunResultKind, timeoutSeconds } from '../index.js';

const execPromise = util.promisify(exec);

export async function runJava(
	javaBinPath: string,
	buildDir: string,
	mainFile: string,
	mainClass: string,
	input: string
): Promise<RunResult> {
	console.log(`- BUILD: ${mainFile}`);
	const compileCommand = `${join(javaBinPath, 'javac')} -cp ${join(
		buildDir,
		'src'
	)} ${mainFile} -d ${join(buildDir, 'build')}`;

	try {
		await execPromise(compileCommand);
	} catch (e) {
		const buildErrorText = e?.toString() ?? 'Unknown build errors.';
		console.log('Build errors: ' + buildErrorText);
		return { kind: 'CompileFailed', resultKindReason: buildErrorText };
	}

	console.log(`- RUN: ${mainClass}`);
	const runCommand = `${join(javaBinPath, 'java')} -cp "${join(buildDir, 'build')}" ${mainClass}`;
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

		let runStartTime = performance.now();
		child.stdin.write(input);
		child.stdin.end();

		let timeLimitExceeded = false;
		let completedNormally = false;

		child.on('close', () => {
			completedNormally = !timeLimitExceeded;

			let runEndTime = performance.now();
			const runtimeMilliseconds = Math.floor(runEndTime - runStartTime);

			if (completedNormally) {
				clearTimeout(timeoutHandle);
				resolve({
					kind: 'Completed',
					output: outputBuffer,
					exitCode: child.exitCode!,
					runtimeMilliseconds
				});
			} else {
				console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
				resolve({
					kind: 'TimeLimitExceeded',
					output: outputBuffer,
					resultKindReason: `Timeout after ${timeoutSeconds} seconds`
				});
			}
		});

		let timeoutHandle = setTimeout(() => {
			if (completedNormally) {
				return;
			}

			console.log(`Run timed out after ${timeoutSeconds} seconds, killing process...`);
			timeLimitExceeded = true;

			child.stdin.end();
			child.stdin.destroy();
			child.stdout.destroy();
			child.stderr.destroy();
			child.kill('SIGKILL');
		}, timeoutSeconds * 1000);
	});
}
