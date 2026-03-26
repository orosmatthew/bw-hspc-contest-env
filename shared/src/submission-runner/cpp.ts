import { join } from 'path';
import { exec, spawn } from 'child_process';
import * as util from 'util';
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
import * as os from 'os';
import * as fs from 'fs-extra';
import { getSourceFilesWithText } from './source-scraper';

const execPromise = util.promisify(exec);

export type CppPlatform = 'VisualStudio' | 'GCC';

interface RunnerParamsCpp extends RunnerParams {
	srcDir: string;
	problemName: string;
	input: string;
	cppPlatform: CppPlatform;
	outputCallback?: (data: string) => void;
}

export const runCpp: Runner<RunnerParamsCpp> = async function (
	params: RunnerParamsCpp
): Promise<RunnerResult> {
	let sourceFiles: Array<SourceFileWithText> | undefined;
	try {
		sourceFiles = await getSourceFilesWithText(
			params.studentCodeRootForProblem,
			'.cpp',
			'.cc',
			'.c',
			'.h',
			'.hpp'
		);
	} catch {
		sourceFiles = undefined;
	}

	const buildDir = join(os.tmpdir(), 'bwcontest-cpp');
	await fs.remove(buildDir);
	await fs.ensureDir(buildDir);

	console.log(`- BUILD: ${params.problemName}`);

	// Configure
	try {
		await execPromise(`cmake -S ${params.srcDir} -B ${buildDir}`);
	} catch (e) {
		const reason = formatExecError(e);
		console.log('Configure errors: ' + reason);
		return {
			success: false,
			runResult: { kind: 'CompileFailed', resultKindReason: reason, sourceFiles }
		};
	}

	// Compile
	try {
		await execPromise(`cmake --build ${buildDir} --target ${params.problemName}`);
	} catch (e) {
		const reason = formatExecError(e);
		console.log('Build errors: ' + reason);
		return {
			success: false,
			runResult: { kind: 'CompileFailed', resultKindReason: reason, sourceFiles }
		};
	}

	console.log(`- RUN: ${params.problemName}`);

	const runCommand =
		params.cppPlatform === 'VisualStudio'
			? join(buildDir, 'Debug', `${params.problemName}.exe`)
			: join(buildDir, params.problemName);

	try {
		let outputBuffer = '';
		params.outputCallback?.('');

		const child = spawn(runCommand, { shell: true });

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
				child.on('close', async () => {
					completedNormally = !timeLimitExceeded;
					const runtimeMilliseconds = Math.floor(performance.now() - runStartTime);
					if (completedNormally) {
						clearTimeout(timeoutHandle);
						resolve({
							kind: 'Completed',
							output: outputBuffer,
							exitCode: child.exitCode ?? undefined,
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

				timeoutHandle = setTimeout(() => {
					if (completedNormally) {
						return;
					}

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
		return { success: false, runResult: { kind: 'RunError', sourceFiles } };
	}
};
