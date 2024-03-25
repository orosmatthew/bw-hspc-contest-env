import type { Contest, Submission } from '@prisma/client';

export function stretchTextarea(textarea: HTMLTextAreaElement) {
	textarea.style.height = textarea.scrollHeight + 'px';
}

export function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}

export function minutesFromContestStart(contest: Contest, eventTimestamp: Date): number {
	return minutesBetweenTimestamps(contest.startTime!, eventTimestamp);
}

export function minutesBetweenTimestamps(start: Date, end: Date): number {
	return (end.getTime() - start.getTime()) / 1000 / 60;
}

export function submissionTimestampHoverText(contest: Contest, submission: Submission): string {
	return (
		`Contest: ${fullTimestampDisplay(contest.startTime!)}\n` +
		`Submission: ${fullTimestampDisplay(submission.createdAt)}`
	);
}

export function fullTimestampDisplay(date: Date): string {
	return date.toLocaleDateString() + ' @ ' + date.toLocaleTimeString();
}
