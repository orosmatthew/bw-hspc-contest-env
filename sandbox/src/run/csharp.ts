import * as fs from 'fs-extra';
import { join } from 'path';
import os = require('os');
import { spawn } from 'child_process';
import kill from 'tree-kill';
import { RunResult, timeoutSeconds } from '../index.js';
import { IRunner, IRunnerReturn } from './types.js';

export const runCSharp: IRunner = async function (params: {
	srcDir: string;
	input: string;
	outputCallback?: (data: string) => void;
}): IRunnerReturn {
	console.log(`- RUN: ${params.srcDir}`);
	const child = spawn('dotnet run', { shell: true, cwd: params.srcDir });

	let outputBuffer = '';
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

	let runStartTime = performance.now();
	child.stdin.write(params.input);
	child.stdin.end();

	let timeLimitExceeded = false;
	let completedNormally = false;

	return {
		success: true,
		runResult: new Promise<RunResult>((resolve) => {
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
};
