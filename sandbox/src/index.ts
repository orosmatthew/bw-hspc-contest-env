import 'dotenv/config';
import fs from 'fs-extra';
import urlJoin from 'url-join';
import os, { EOL } from 'os';
import { join } from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { runJava } from 'bwcontest-shared/submission-runner/java.cjs';
import { runCSharp } from 'bwcontest-shared/submission-runner/csharp.cjs';
import { runCpp } from 'bwcontest-shared/submission-runner/cpp.cjs';
import { RunResult, RunResultZod } from 'bwcontest-shared/submission-runner/types.cjs';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const submissionPostData = z
	.object({
		submissionId: z.number(),
		result: RunResultZod
	})
	.strict();

const submissionGetData = z
	.object({
		success: z.boolean(),
		submission: z
			.object({
				id: z.number(),
				contestId: z.number(),
				contestName: z.string(),
				teamId: z.number(),
				teamName: z.string(),
				teamLanguage: z.enum(['Java', 'CSharp', 'CPP']),
				problem: z.object({
					id: z.number(),
					pascalName: z.string(),
					realInput: z.string()
				}),
				commitHash: z.string()
			})
			.nullable()
	})
	.strict();

type SubmissionGetData = z.infer<typeof submissionGetData>;
type SubmissionPostData = z.infer<typeof submissionPostData>;

enum SubmissionProcessingResult {
	NoSubmissions,
	SubmissionProcessed,
	Error
}

async function fetchQueuedSubmission(): Promise<SubmissionGetData | undefined> {
	const res = await fetch(submissionApiUrl, {
		method: 'GET',
		headers: { secret: process.env.WEB_SANDBOX_SECRET! }
	});
	if (res.status !== 200) {
		console.error(
			`Failed to fetch from ${submissionApiUrl} with status: ${res.status} ${res.statusText}`
		);
		return undefined;
	}

	const json = await res.json();
	const data = submissionGetData.parse(json);
	if (!data.success) {
		return undefined;
	}

	return data;
}

async function cloneAndRun(submissionData: SubmissionGetData) {
	if (!submissionData.submission || !submissionData.success) {
		return;
	}
	const tmpDir = os.tmpdir();
	const repoDir = join(tmpDir, 'bwcontest-src');
	if (fs.existsSync(repoDir)) {
		fs.removeSync(repoDir);
	}
	fs.mkdirSync(repoDir);

	const teamRepoUrl = urlJoin(
		repoUrl,
		submissionData.submission.contestId.toString(),
		submissionData.submission.teamId.toString() + '.git'
	);

	console.log(`- CLONE: from ${teamRepoUrl}`);
	const git: SimpleGit = simpleGit({ baseDir: repoDir });
	await git.clone(teamRepoUrl, '.');
	await git.checkout(submissionData.submission.commitHash);

	const problemName = submissionData.submission.problem.pascalName;
	const studentCodeRootForProblem = join(repoDir, problemName);

	let runResult: RunResult | undefined;

	try {
		if (submissionData.submission.teamLanguage === 'Java') {
			const res = await runJava({
				srcDir: repoDir,
				studentCodeRootForProblem,
				mainFile: join(repoDir, problemName, problemName + '.java'),
				mainClass: problemName,
				input: submissionData.submission.problem.realInput
			});
			if (res.success === true) {
				runResult = await res.runResult;
			} else {
				runResult = res.runResult;
			}
		} else if (submissionData.submission.teamLanguage === 'CSharp') {
			const res = await runCSharp({
				srcDir: join(repoDir, problemName),
				studentCodeRootForProblem,
				input: submissionData.submission.problem.realInput
			});
			if (res.success === true) {
				runResult = await res.runResult;
			} else {
				runResult = res.runResult;
			}
		} else if (submissionData.submission.teamLanguage === 'CPP') {
			const res = await runCpp({
				srcDir: repoDir,
				studentCodeRootForProblem,
				input: submissionData.submission.problem.realInput,
				cppPlatform: 'GCC',
				problemName: submissionData.submission.problem.pascalName
			});
			if (res.success === true) {
				runResult = await res.runResult;
			} else {
				runResult = res.runResult;
			}
		}
	} catch (error) {
		runResult = {
			kind: 'RunError',
			resultKindReason: `An unexpected error occurred: ${EOL} ${error}`
		};
	}

	if (runResult !== undefined) {
		printRunResult(runResult);

		const postBodyObject: SubmissionPostData = {
			submissionId: submissionData.submission.id,
			result: runResult
		};
		const res = await fetch(urlJoin(adminUrl, 'api/submission'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', secret: process.env.WEB_SANDBOX_SECRET! },
			body: JSON.stringify(postBodyObject)
		});
		if (res.status !== 200) {
			console.error('- POST: Failed with error code: ' + res.status + ' ' + res.statusText);
			return;
		}

		const data = (await res.json()) as { success: boolean };
		if (!data.success) {
			console.error('- POST: Failed with response: ' + JSON.stringify(data));
			return;
		}

		console.log(`- POST: Succeeded`);
	} else {
		console.warn(`runResult is undefined`);
	}
}

function printRunResult(runResult: RunResult) {
	console.log(`- RESULT: ${getRunResultDisplayText()}`);

	function getRunResultDisplayText() {
		if (runResult.kind == 'RunError') {
			return 'Sandbox error: ' + runResult.resultKindReason;
		}

		if (runResult.kind == 'CompileFailed') {
			return 'Failed to compile';
		}

		if (runResult.kind == 'TimeLimitExceeded') {
			return `Time limit exceeded. Output Length: ${runResult.output?.length}.`;
		}

		return `Run completed. Time: ${runResult.runtimeMilliseconds}ms. Output Length: ${runResult.output?.length}. Exit Code: ${runResult.exitCode}`;
	}
}

function validateEnv(): boolean {
	return (
		process.env.ADMIN_URL !== undefined &&
		process.env.REPO_URL !== undefined &&
		process.env.WEB_SANDBOX_SECRET !== undefined
	);
}

if (!validateEnv()) {
	console.log(process.env);
	console.log(
		'process.env.ADMIN_URL is ' +
			process.env.ADMIN_URL +
			' and process.env.REPO_URL is ' +
			process.env.REPO_URL
	);
	throw Error('Invalid environment');
}

const adminUrl = process.env.ADMIN_URL as string;
const repoUrl = process.env.REPO_URL as string;

const submissionApiUrl = urlJoin(adminUrl, 'api/submission');

async function processNextSubmission(): Promise<SubmissionProcessingResult> {
	let submissionData: SubmissionGetData | undefined;
	try {
		submissionData = await fetchQueuedSubmission();
	} catch (e) {
		console.error(`Failed to fetch from ${submissionApiUrl} with error: ${e}`);
		return SubmissionProcessingResult.Error;
	}

	if (!submissionData) {
		console.error('Unable to fetch submission data');
		return SubmissionProcessingResult.Error;
	}

	if (!submissionData.submission) {
		return SubmissionProcessingResult.NoSubmissions;
	}

	printSubmissionHeader(submissionData);

	let processingResult: SubmissionProcessingResult;
	try {
		await cloneAndRun(submissionData);
		processingResult = SubmissionProcessingResult.SubmissionProcessed;
	} catch {
		console.error('Failed to clone/run.');
		processingResult = SubmissionProcessingResult.Error;
	}

	printSubmissionFooter(submissionData);
	return processingResult;
}

function printSubmissionHeader(submissionData: SubmissionGetData) {
	const submission = submissionData.submission;
	if (!submission) {
		return;
	}

	console.log(`--- Submission ${submission.id} ---`);
	console.log(
		`- INFO: Contest ${submission.contestId} '${submission.contestName}', ` +
			`Team ${submission.teamId} '${submission.teamName}', ` +
			`Problem ${submission.problem.id} '${submission.problem.pascalName}', ` +
			`SHA '${submission.commitHash}'`
	);
}

function printSubmissionFooter(submissionData: SubmissionGetData) {
	const submission = submissionData.submission;
	if (!submission) {
		return;
	}

	console.log(`--- End Submission ${submission.id} ---`);
}

async function run() {
	console.log('Sandbox started. Periodically checking for submissions.');

	let iterationsSinceProcessedSubmission = 0;
	let anySubmissionsProcessed = false;
	while (true) {
		switch (await processNextSubmission()) {
			case SubmissionProcessingResult.SubmissionProcessed:
				iterationsSinceProcessedSubmission = 0;
				anySubmissionsProcessed = true;
				break;
			case SubmissionProcessingResult.NoSubmissions:
				if (iterationsSinceProcessedSubmission > 0 && iterationsSinceProcessedSubmission % 6 == 0) {
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
			case SubmissionProcessingResult.Error:
				await new Promise((resolve) => setTimeout(resolve, 10000));
				break;
		}
	}
}

run();
