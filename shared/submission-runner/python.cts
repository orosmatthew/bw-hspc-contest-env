import { spawn } from 'child_process';
import kill from 'tree-kill';
import type { IRunner, IRunnerParams, IRunnerReturn, RunResult } from './types.cjs';
import { timeoutSeconds } from './settings.cjs';
import { getSourceFilesWithText } from './sourceScraper.cjs';

interface IRunnerParamsPython extends IRunnerParams {
	problemName: string;
}

export const runPython: IRunner<IRunnerParamsPython> = async function (
	params: IRunnerParamsPython
): Promise<IRunnerReturn> {
	const sourceFiles = await getSourceFilesWithText(params.studentCodeRootForProblem, '.py');

	console.log(`- RUN: ${params.problemName}`);
	try {
		const child = spawn(`python3 ${params.problemName}.py`, { shell: true, cwd: params.srcDir });

		let outputBuffer = '';
		params.outputCallback?.('');
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
					if (child.pid !== undefined) {
						kill(child.pid);
					}
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
		console.error(error);
		return { success: false, runResult: { kind: 'RunError', sourceFiles } };
	}
};
