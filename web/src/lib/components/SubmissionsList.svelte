<script lang="ts">
	import { goto } from '$app/navigation';
	import TestCaseResults from '$lib/components/TestCaseResults.svelte';
	import {
		minutesBetweenTimestamps,
		minutesFromContestStart,
		submissionTimestampHoverText
	} from '$lib/common/utils';
	import type { Contest } from 'bwcontest-shared/types/contest';
	import type { ProblemPrivate } from 'bwcontest-shared/types/problem';
	import type { SubmissionPrivate } from 'bwcontest-shared/types/submission';
	import { SvelteMap } from 'svelte/reactivity';
	import { resolve } from '$app/paths';

	interface Props {
		contest: Contest;
		submissions: Array<SubmissionPrivate>;
		contestProblems: Array<ProblemPrivate>;
		includesAllAttempts?: boolean;
		sortDirection: 'newest first' | 'oldest first';
	}

	let {
		contest,
		submissions,
		contestProblems,
		includesAllAttempts = false,
		sortDirection
	}: Props = $props();

	function getAttemptText(submission: SubmissionPrivate): string {
		return `${stats.attemptNumbers.get(submission) ?? -1} / ${stats.historyCounts.get(getSubmissionHistoryKey(submission)) ?? -1}`;
	}

	function getSubmissionHistoryKey(submission: SubmissionPrivate): string {
		return `${submission.contestId};${submission.teamId};${submission.problemId}`;
	}

	const showOutputColumns = $derived(submissions.some((s) => s.state !== 'queued'));

	const sortedSubmissions = $derived(
		submissions.toSorted(
			(a, b) =>
				(a.createdAt.getTime() - b.createdAt.getTime()) *
				(sortDirection === 'oldest first' ? 1 : -1)
		)
	);

	const stats = $derived.by<{
		historyCounts: Map<string, number>;
		attemptNumbers: Map<SubmissionPrivate, number>;
	}>(() => {
		const historyCounts = new SvelteMap<string, number>();
		const attemptNumbers = new SvelteMap<SubmissionPrivate, number>();

		if (includesAllAttempts) {
			const submissionsInChronologicalOrder = submissions.toSorted((a, b) => {
				return a.createdAt.valueOf() - b.createdAt.valueOf();
			});

			for (let submission of submissionsInChronologicalOrder) {
				let key = getSubmissionHistoryKey(submission);

				const currentCount = (historyCounts.get(key) ?? 0) + 1;
				historyCounts.set(key, currentCount);
				attemptNumbers.set(submission, currentCount);
			}
		}

		return { historyCounts, attemptNumbers };
	});
</script>

<div class="mt-3 table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Team</th>
				<th>Problem</th>
				{#if includesAllAttempts}
					<th>Attempt</th>
				{/if}
				<th>Judgment</th>
				{#if showOutputColumns}
					<th>Test Case Summary</th>
					<th>Runtime</th>
				{/if}
				<th>Submitted</th>
				<th>Grading</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedSubmissions as submission (submission.id)}
				{@const problem = contestProblems.find((p) => p.id === submission.problemId)}
				<tr
					class="submissionRow"
					onclick={() =>
						goto(
							resolve('/admin/contests/[contestId]/submissions/[submissionId]', {
								contestId: submission.contestId.toString(),
								submissionId: submission.id.toString()
							})
						)}
				>
					<td>
						{submission.teamName}<br />
					</td>
					<td>
						{#if problem !== undefined}
							{problem.friendlyName}
						{/if}
					</td>
					{#if includesAllAttempts}
						<td>
							<span>{getAttemptText(submission)}</span>
						</td>
					{/if}
					<td>
						{#if submission.state === 'queued'}
							<span class="badge bg-secondary">Queued</span>
						{:else if submission.state === 'inReview'}
							<span class="badge bg-warning">In Review</span>
						{:else if submission.state === 'correct'}
							<span class="badge bg-success">Correct</span>
						{:else if submission.state === 'incorrect'}
							<span class="badge bg-danger">Incorrect</span>
						{/if}

						{#if submission.stateReason === 'buildError'}
							<span class="badge bg-danger opacity-50">Build Error</span>
						{:else if submission.stateReason === 'timeLimitExceeded'}
							<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
						{:else if submission.stateReason === 'incorrectOverriddenAsCorrect'}
							<span class="badge bg-success opacity-50">Manually Graded</span>
						{/if}
					</td>
					{#if showOutputColumns}
						<td>
							{#if problem !== undefined}
								{#key submission.testCaseResults}
									<TestCaseResults {problem} {submission} condensed={true} />
								{/key}
							{/if}
						</td>
						<td>
							{submission.runtimeMilliseconds !== null
								? `${submission.runtimeMilliseconds} ms`
								: ''}
						</td>
					{/if}
					<td>
						<span title={submissionTimestampHoverText(contest, submission)}>
							{Math.ceil(minutesFromContestStart(contest, submission.createdAt))} min
						</span>
					</td>
					<td>
						{#if submission.gradedAt}
							+{Math.ceil(minutesFromContestStart(contest, submission.gradedAt)) -
								Math.ceil(minutesFromContestStart(contest, submission.createdAt))} min
						{:else}
							{@const minutesSinceSubmit = minutesBetweenTimestamps(
								submission.createdAt,
								new Date()
							)}
							{#if minutesSinceSubmit < 1}
								<span class="judgmentPending recent">&lt; 1 min...</span>
							{:else if minutesSinceSubmit < 3}
								<span class="judgmentPending old1">{Math.round(minutesSinceSubmit)} min...</span>
							{:else if minutesSinceSubmit < 5}
								<span class="judgmentPending old2">{Math.round(minutesSinceSubmit)} min...</span>
							{:else if minutesSinceSubmit < 10}
								<span class="judgmentPending old3">{Math.round(minutesSinceSubmit)} min...</span>
							{:else}
								<span class="judgmentPending old4">{Math.round(minutesSinceSubmit)} min...</span>
							{/if}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.submissionRow {
		cursor: pointer;
	}

	.judgmentPending {
		font-style: italic;
	}
	.judgmentPending.recent {
		color: #1aba00;
	}
	.judgmentPending.old1 {
		color: #aba500;
	}
	.judgmentPending.old2 {
		color: #e99a00;
	}
	.judgmentPending.old3 {
		color: #ee0000;
	}
	.judgmentPending.old4 {
		color: #ee0000;
		font-weight: bold;
	}
</style>
