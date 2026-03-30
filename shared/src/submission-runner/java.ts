import { join } from 'path';
import { exec, spawn } from 'child_process';
import * as util from 'util';
import * as fs from 'fs-extra';
import {
	formatExecError,
	SourceFileWithText,
	type Runner,
	type RunnerParams,
	type RunnerResult,
	type RunResult
} from './common';
import { timeoutSeconds } from './config';
import kill from 'tree-kill';
import { getSourceFilesWithText } from './source-scraper';

const execPromise = util.promisify(exec);

interface RunnerParamsJava extends RunnerParams {
	srcDir: string;
	mainFile: string;
	mainClass: string;
	input: string;
	outputCallback?: (data: string) => void;
}

export const runJava: Runner<RunnerParamsJava> = async function (
	params: RunnerParamsJava
): Promise<RunnerResult> {
	let sourceFiles: Array<SourceFileWithText> | undefined;
	try {
		sourceFiles = await getSourceFilesWithText(params.studentCodeRootForProblem, '.java');
	} catch {
		sourceFiles = undefined;
	}

	const buildDir = join(params.srcDir, 'build');
	await fs.remove(buildDir);
	await fs.ensureDir(buildDir);

	console.log(`- BUILD: ${params.mainFile}`);

	const compileCommand = `javac -cp "${join(params.srcDir, 'src')}" "${params.mainFile}" -d "${buildDir}"`;

	try {
		await execPromise(compileCommand);
	} catch (e) {
		const reason = formatExecError(e);
		console.log('Build errors: ' + reason);
		return {
			success: false,
			runResult: { kind: 'compileFailed', resultKindReason: reason, sourceFiles }
		};
	}

	console.log(`- RUN: ${params.mainClass}`);

	try {
		let outputBuffer = '';
		params.outputCallback?.('');

		const child = spawn('java', ['-cp', buildDir, params.mainClass]);

		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (data: string) => {
			outputBuffer += data;
			params.outputCallback?.(data);
		});

		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (data: string) => {
			outputBuffer += data;
			params.outputCallback?.(data);
		});

		child.stdin.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code !== 'EPIPE') {
				console.error('Unexpected stdin error:', err);
			}
		});

		let timeLimitExceeded = false;
		let completedNormally = false;
		let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

		const runStartTime = performance.now();
		child.stdin.write(params.input);
		child.stdin.end();

		return {
			success: true,
			runResult: new Promise<RunResult>((resolve) => {
				child.on('close', () => {
					completedNormally = !timeLimitExceeded;
					const runtimeMilliseconds = Math.floor(performance.now() - runStartTime);

					if (completedNormally) {
						clearTimeout(timeoutHandle);
						resolve({
							kind: 'completed',
							output: outputBuffer,
							exitCode: child.exitCode ?? undefined,
							runtimeMilliseconds,
							sourceFiles
						});
					} else {
						console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
						resolve({
							kind: 'timeLimitExceeded',
							output: outputBuffer,
							resultKindReason: `Timeout after ${timeoutSeconds} seconds`,
							sourceFiles
						});
					}
				});

				timeoutHandle = setTimeout(() => {
					if (completedNormally) return;

					console.log(`Run timed out after ${timeoutSeconds} seconds, killing process...`);
					timeLimitExceeded = true;

					child.stdin.destroy();
					child.stdout.destroy();
					child.stderr.destroy();
					if (child.pid !== undefined) {
						kill(child.pid);
					}
				}, timeoutSeconds * 1000);
			}),
			killFunc() {
				if (child.pid !== undefined && !completedNormally && !timeLimitExceeded) {
					timeLimitExceeded = true;
					kill(child.pid);
					params.outputCallback?.('\n[Manually stopped]');
				}
			}
		};
	} catch (error) {
		console.error(error);
		return { success: false, runResult: { kind: 'runError', sourceFiles } };
	}
};
