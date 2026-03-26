import { spawn } from 'child_process';
import kill from 'tree-kill';
import type { Runner, RunnerParams, RunnerResult, RunResult, SourceFileWithText } from './common';
import { timeoutSeconds } from './config';
import { getSourceFilesWithText } from './source-scraper';

type CSharpBuildResult =
	| { success: true }
	| { success: false; exitCode: number | null; errorText: string };

export const runCSharp: Runner = async function (params: RunnerParams): Promise<RunnerResult> {
	let sourceFiles: Array<SourceFileWithText> | undefined;
	try {
		sourceFiles = await getSourceFilesWithText(params.studentCodeRootForProblem, '.cs');
	} catch {
		sourceFiles = undefined;
	}

	console.log(`- BUILD: ${params.srcDir}`);
	const buildResult = await new Promise<CSharpBuildResult>((resolve) => {
		let buildOutput = '';

		const buildProcess = spawn('dotnet', ['build'], { cwd: params.srcDir });

		buildProcess.stdout.setEncoding('utf8');
		buildProcess.stdout.on('data', (data: string) => {
			buildOutput += data;
		});

		buildProcess.stderr.setEncoding('utf8');
		buildProcess.stderr.on('data', (data: string) => {
			buildOutput += data;
		});

		buildProcess.on('error', (error) => {
			resolve({ success: false, exitCode: null, errorText: error.message });
		});

		buildProcess.on('close', (exitCode) => {
			if (exitCode === 0) {
				resolve({ success: true });
			} else {
				resolve({ success: false, exitCode, errorText: buildOutput });
			}
		});
	});

	if (!buildResult.success) {
		return {
			success: false,
			runResult: {
				kind: 'CompileFailed',
				resultKindReason: buildResult.errorText,
				exitCode: buildResult.exitCode ?? undefined,
				sourceFiles
			}
		};
	}

	console.log(`- RUN: ${params.srcDir}`);
	try {
		const child = spawn('dotnet', ['run', '--no-build'], { cwd: params.srcDir });

		let outputBuffer = '';
		params.outputCallback?.('');

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
		return { success: false, runResult: { kind: 'RunError', sourceFiles } };
	}
};
