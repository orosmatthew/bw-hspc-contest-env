import dotenv from 'dotenv';
import fs from 'fs-extra';
import urlJoin from 'url-join';
import { z } from 'zod';
import os from 'os';
import { join } from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { runJava } from './run/java.js';

const submissionGetData = z
	.object({
		success: z.boolean(),
		submission: z
			.object({
				id: z.number(),
				contestId: z.number(),
				teamId: z.number(),
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

async function fetchQueuedSubmission(): Promise<SubmissionGetData | undefined> {
	const res = await fetch(urlJoin(adminUrl, 'api/submission'), { method: 'GET' });
	if (res.status !== 200) {
		console.error('Failed to fetch submission');
		return undefined;
	}
	const data = submissionGetData.parse(await res.json());
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
	const buildDir = join(tmpDir, 'bwcontest_java');
	if (fs.existsSync(buildDir)) {
		fs.removeSync(buildDir);
	}
	fs.mkdirSync(buildDir);
	const repoDir = join(buildDir, 'src');
	fs.mkdirSync(repoDir);

	const git: SimpleGit = simpleGit({ baseDir: repoDir });
	await git.clone(
		urlJoin(
			repoUrl,
			submissionData.submission.contestId.toString(),
			submissionData.submission.teamId.toString() + '.git'
		),
		'.'
	);
	await git.checkout(submissionData.submission.commitHash);
	const problemName = submissionData.submission.problem.pascalName;
	const output = await runJava(
		javaBinPath,
		buildDir,
		join(repoDir, problemName, problemName + '.java'),
		problemName,
		submissionData.submission.problem.realInput
	);

	const res = await fetch(urlJoin(adminUrl, 'api/submission'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ submissionId: submissionData.submission.id, output: output })
	});
	if (res.status !== 200) {
		console.error('Failed to POST output');
	}
	const data = (await res.json()) as { success: boolean };
	if (!data.success) {
		console.error('Output POST unsuccessful');
	}
}

function validateEnv(): boolean {
	return (
		process.env.ADMIN_URL !== undefined &&
		process.env.REPO_URL !== undefined &&
		process.env.JAVA_PATH !== undefined
	);
}

dotenv.config();

if (!validateEnv()) {
	throw Error('Invalid environment');
}

const adminUrl = process.env.ADMIN_URL as string;
const repoUrl = process.env.REPO_URL as string;
const javaBinPath = process.env.JAVA_PATH as string;

async function loop() {
	let submissionData: SubmissionGetData | undefined;
	try {
		submissionData = await fetchQueuedSubmission();
	} catch {
		console.error('Failed to fetch submission');
		return;
	}

	if (!submissionData) {
		console.error('Unable to fetch submission data');
	} else {
		try {
			cloneAndRun(submissionData);
		} catch {
			console.error('Unable to clone and run');
		}
	}
}

async function run() {
	while (true) {
		await loop();
		await new Promise((resolve) => setTimeout(resolve, 15000));
	}
}

run();
