import { apiClient, gitClient } from './index.js';
import type { SubmissionPrivate } from 'bwcontest-shared/types/submission';
import { join } from 'path';
import type { ProblemPrivate } from 'bwcontest-shared/types/problem';
import type { TeamPrivate } from 'bwcontest-shared/types/team';
import { RunResult } from 'bwcontest-shared/submission-runner/common';
import { runJava } from 'bwcontest-shared/submission-runner/java';
import { runCSharp } from 'bwcontest-shared/submission-runner/csharp';
import { runCpp } from 'bwcontest-shared/submission-runner/cpp';
import { runPython } from 'bwcontest-shared/submission-runner/python';
import { EOL } from 'os';

export type SubmissionProcessingResult = 'noSubmissions' | 'submissionProcessed' | 'error';

export class SandboxService {
	public async run(): Promise<void> {
		console.log('Sandbox started. Periodically checking for submissions.');
		let iterationsSinceProcessedSubmission = 0;
		let anySubmissionsProcessed = false;
		while (true) {
			switch (await this._processNextSubmission()) {
				case 'submissionProcessed':
					iterationsSinceProcessedSubmission = 0;
					anySubmissionsProcessed = true;
					break;
				case 'noSubmissions':
					if (
						iterationsSinceProcessedSubmission > 0 &&
						iterationsSinceProcessedSubmission % 6 === 0
					) {
						{
							const numMinutes = iterationsSinceProcessedSubmission / 6;
							console.log(
								`${numMinutes} minute${numMinutes > 1 ? 's' : ''} since ` +
									`${
										anySubmissionsProcessed
											? `last submission processed`
											: `sandbox startup with no submissions`
									}`
							);
						}
					}
					await new Promise((resolve) => setTimeout(resolve, 10000));
					iterationsSinceProcessedSubmission++;
					break;
				case 'error':
					await new Promise((resolve) => setTimeout(resolve, 10000));
					break;
			}
		}
	}

	private async _processNextSubmission(): Promise<SubmissionProcessingResult> {
		const submissionRes = await apiClient.getSubmission();
		if (!submissionRes.success) {
			console.error(`Unable to fetch submission data: ${submissionRes.message}`);
			return 'error';
		}
		if (submissionRes.data === null) {
			return 'noSubmissions';
		}
		this._printSubmissionHeader({
			submission: submissionRes.data.submission,
			problem: submissionRes.data.problem
		});
		let processingResult: SubmissionProcessingResult;
		try {
			await this._cloneAndRun({
				submission: submissionRes.data.submission,
				problem: submissionRes.data.problem,
				team: submissionRes.data.team
			});
			processingResult = 'submissionProcessed';
		} catch {
			console.error('Failed to clone/run.');
			processingResult = 'error';
		}
		this._printSubmissionFooter({ submission: submissionRes.data.submission });
		return processingResult;
	}

	private _printSubmissionHeader(params: {
		submission: SubmissionPrivate;
		problem: ProblemPrivate;
	}): void {
		console.log(`--- Submission ${params.submission.id} ---`);
		console.log(
			`- INFO: Contest ${params.submission.contestId},` +
				`Team ${params.submission.teamId} '${params.submission.teamName}', ` +
				`Problem ${params.problem.id} '${params.problem.pascalName}', ` +
				`SHA '${params.submission.commitHash}'`
		);
	}

	private _printSubmissionFooter(params: { submission: SubmissionPrivate }) {
		console.log(`--- End Submission ${params.submission.id} ---`);
	}

	private async _cloneAndRun(params: {
		submission: SubmissionPrivate;
		problem: ProblemPrivate;
		team: TeamPrivate;
	}) {
		const { repoDir } = await gitClient.cloneAndCheckoutSubmission(params.submission);
		const problemName = params.problem.pascalName;
		const studentCodeRootForProblem = join(repoDir, problemName);
		let runResult: RunResult | undefined;
		try {
			if (params.team.language === 'java') {
				const res = await runJava({
					srcDir: repoDir,
					studentCodeRootForProblem,
					mainFile: join(repoDir, problemName, problemName + '.java'),
					mainClass: problemName,
					input: params.problem.realInput
				});
				if (res.success === true) {
					runResult = await res.runResult;
				} else {
					runResult = res.runResult;
				}
			} else if (params.team.language === 'csharp') {
				const res = await runCSharp({
					srcDir: join(repoDir, problemName),
					studentCodeRootForProblem,
					input: params.problem.realInput
				});
				if (res.success === true) {
					runResult = await res.runResult;
				} else {
					runResult = res.runResult;
				}
			} else if (params.team.language === 'cpp') {
				const res = await runCpp({
					srcDir: repoDir,
					studentCodeRootForProblem,
					input: params.problem.realInput,
					cppPlatform: 'GCC',
					problemName: params.problem.pascalName
				});
				if (res.success === true) {
					runResult = await res.runResult;
				} else {
					runResult = res.runResult;
				}
			} else if (params.team.language === 'python') {
				const res = await runPython({
					srcDir: join(repoDir, problemName),
					studentCodeRootForProblem,
					input: params.problem.realInput,
					problemName: params.problem.pascalName
				});
				if (res.success === true) {
					runResult = await res.runResult;
				} else {
					runResult = res.runResult;
				}
			}
		} catch (error) {
			runResult = {
				kind: 'runError',
				resultKindReason: `An unexpected error occurred: ${EOL} ${String(error)}`
			};
		}
		if (runResult !== undefined) {
			this._printRunResult(runResult);
			const postRes = await apiClient.postSubmission({
				submissionId: params.submission.id,
				result: runResult
			});
			if (!postRes.success) {
				console.error(`- POST: Failed with response: ${postRes.message}`);
				return;
			}
			console.log(`- POST: Succeeded`);
		} else {
			console.warn(`runResult is undefined`);
		}
	}

	private _printRunResult(runResult: RunResult): void {
		console.log(`- RESULT: ${getRunResultDisplayText()}`);
		function getRunResultDisplayText() {
			if (runResult.kind === 'runError') {
				return 'Sandbox error: ' + runResult.resultKindReason;
			}
			if (runResult.kind === 'compileFailed') {
				return 'Failed to compile';
			}
			if (runResult.kind === 'timeLimitExceeded') {
				return `Time limit exceeded. Output Length: ${runResult.output?.length}.`;
			}
			return `Run completed. Time: ${runResult.runtimeMilliseconds}ms. Output Length: ${runResult.output?.length}. Exit Code: ${runResult.exitCode}`;
		}
	}
}
