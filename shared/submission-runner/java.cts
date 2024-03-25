import { join } from 'path';
import { exec, spawn } from 'child_process';
import * as util from 'util';
import type { IRunner, IRunnerParams, IRunnerReturn, RunResult } from './types.cjs';
import { timeoutSeconds } from './settings.cjs';
import kill from 'tree-kill';
import { getSourceFilesWithText } from './sourceScraper.cjs';

const execPromise = util.promisify(exec);

interface IRunnerParamsJava extends IRunnerParams {
	srcDir: string;
	mainFile: string;
	mainClass: string;
	input: string;
	outputCallback?: (data: string) => void;
}

export const runJava: IRunner<IRunnerParamsJava> = async function (
	params: IRunnerParamsJava
): Promise<IRunnerReturn> {
	const sourceFiles = await getSourceFilesWithText(params.studentCodeRootForProblem, '.java');

	console.log(`- BUILD: ${params.mainFile}`);
	const compileCommand = `javac -cp ${join(params.srcDir, 'src')} ${params.mainFile} -d ${join(params.srcDir, 'build')}`;

	try {
		await execPromise(compileCommand);
	} catch (e) {
		const buildErrorText = e?.toString() ?? 'Unknown build errors.';
		console.log('Build errors: ' + buildErrorText);
		return {
			success: false,
			runResult: { kind: 'CompileFailed', resultKindReason: buildErrorText, sourceFiles }
		};
	}

	console.log(`- RUN: ${params.mainClass}`);
	const runCommand = `java -cp "${join(params.srcDir, 'build')}" ${params.mainClass}`;

	try {
		let outputBuffer = '';
		const child = spawn(runCommand, { shell: true });
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (data) => {
			outputBuffer += data.toString();
			params.outputCallback?.(data.toString());
		});
		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (data) => {
			outputBuffer += data.toString();
			params.outputCallback?.(data.toString());
		});

		const runStartTime = performance.now();
		child.stdin.write(params.input);
		child.stdin.end();

		let timeLimitExceeded = false;
		let completedNormally = false;

		return {
			success: true,
			runResult: new Promise<RunResult>((resolve) => {
				child.on('close', () => {
					completedNormally = !timeLimitExceeded;

					const runEndTime = performance.now();
					const runtimeMilliseconds = Math.floor(runEndTime - runStartTime);

					if (completedNormally) {
						clearTimeout(timeoutHandle);
						resolve({
							kind: 'Completed',
							output: outputBuffer,
							exitCode: child.exitCode!,
							runtimeMilliseconds,
							sourceFiles
						});
					} else {
						console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
						resolve({
							kind: 'TimeLimitExceeded',
							output: outputBuffer,
							resultKindReason: `Timeout after ${timeoutSeconds} seconds`,
							sourceFiles
						});
					}
				});

				const timeoutHandle = setTimeout(() => {
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
			}),
			killFunc() {
				if (child.pid !== undefined) {
					if (!completedNormally && !timeLimitExceeded) {
						kill(child.pid);
						params.outputCallback?.('\n[Manually stopped]');
					}
				}
			}
		};
	} catch (error) {
		return { success: false, runResult: { kind: 'RunError', sourceFiles } };
	}
};
