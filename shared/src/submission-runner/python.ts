import { spawn } from 'child_process';
import kill from 'tree-kill';
import type { Runner, RunnerParams, RunnerResult, RunResult, SourceFileWithText } from './common';
import { timeoutSeconds } from './config';
import { getSourceFilesWithText } from './source-scraper';

interface RunnerParamsPython extends RunnerParams {
	problemName: string;
}

export const runPython: Runner<RunnerParamsPython> = async function (
	params: RunnerParamsPython
): Promise<RunnerResult> {
	let sourceFiles: Array<SourceFileWithText> | undefined;
	try {
		sourceFiles = await getSourceFilesWithText(params.studentCodeRootForProblem, '.py');
	} catch {
		sourceFiles = undefined;
	}

	console.log(`- RUN: ${params.problemName}`);
	try {
		const child = spawn('python3', [`${params.problemName}.py`], { cwd: params.srcDir });

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
