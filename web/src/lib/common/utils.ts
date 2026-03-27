import { building } from '$app/environment';
import type { Contest } from '$lib/server/repos/contest-repo';
import type { Submission } from '$lib/server/repos/submission-repo';
import z, { json } from 'zod';

export function stretchTextarea(textarea: HTMLTextAreaElement) {
	textarea.style.height = textarea.scrollHeight + 'px';
}

export function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}

export function minutesFromContestStart(contest: Contest, eventTimestamp: Date): number {
	if (contest.startTime === null) {
		throw new Error("contest.startTime is null when it shouldn't");
	}
	return minutesBetweenTimestamps(contest.startTime, eventTimestamp);
}

export function minutesBetweenTimestamps(start: Date, end: Date): number {
	return (end.getTime() - start.getTime()) / 1000 / 60;
}

export function submissionTimestampHoverText(contest: Contest, submission: Submission): string {
	if (contest.startTime === null) {
		throw new Error("contest.startTime is null when it shouldn't");
	}
	return (
		`Contest: ${fullTimestampDisplay(contest.startTime)}\n` +
		`Submission: ${fullTimestampDisplay(submission.createdAt)}`
	);
}

export function fullTimestampDisplay(date: Date): string {
	return date.toLocaleDateString() + ' @ ' + date.toLocaleTimeString();
}

export const stringToJsonSchema = z
	.string()
	.transform((str, ctx): z.infer<ReturnType<typeof json>> => {
		try {
			return JSON.parse(str);
		} catch (e) {
			ctx.addIssue({ code: 'custom', message: `Invalid JSON: ${e}` });
			return z.NEVER;
		}
	});

export const checkboxSchema = z
	.string()
	.optional()
	.transform((value) => value === 'on');

export function initRuntimeOnly<T>(factory: () => T): T {
	if (building) {
		return undefined as T;
	}
	return factory();
}
