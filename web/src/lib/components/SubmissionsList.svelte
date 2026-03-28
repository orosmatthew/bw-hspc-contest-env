<script lang="ts">
	import { goto } from '$app/navigation';
	import TestCaseResults from '$lib/components/TestCaseResults.svelte';
	import {
		minutesBetweenTimestamps,
		minutesFromContestStart,
		submissionTimestampHoverText
	} from '$lib/common/utils';
	import { SvelteMap } from 'svelte/reactivity';
	import type { Submission } from 'bwcontest-shared/types/submission';
	import type { Contest } from 'bwcontest-shared/types/contest';
	import type { ProblemPrivate } from 'bwcontest-shared/types/problem';

	interface Props {
		contest: Contest;
		submissions: Array<Submission>;
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

	let showOutputColumns = $state(true);

	let historyCounts = new SvelteMap<string, number>();
	let attemptNumbers = new SvelteMap<Submission, number>();

	function getAttemptText(submission: Submission): string {
		return `${attemptNumbers.get(submission) ?? -1} / ${historyCounts.get(getSubmissionHistoryKey(submission)) ?? -1}`;
	}

	function getSubmissionHistoryKey(submission: Submission): string {
		return `${submission.contestId};${submission.teamId};${submission.problemId}`;
	}

	$effect(() => {
		showOutputColumns = submissions.some((s) => s.state !== 'queued');

		submissions.sort(
			(s1, s2) =>
				(s1.createdAt.getTime() - s2.createdAt.getTime()) *
				(sortDirection === 'oldest first' ? 1 : -1)
		);

		historyCounts.clear();
		attemptNumbers.clear();

		if (includesAllAttempts) {
			const submissionsInChronologicalOrder = submissions.toSorted((a, b) => {
				return a.createdAt.valueOf() - b.createdAt.valueOf();
			});

			for (let submission of submissionsInChronologicalOrder) {
				let key = getSubmissionHistoryKey(submission);
				if (!historyCounts.has(key)) {
					historyCounts.set(key, 0);
				}

				const h1 = historyCounts.get(key);
				if (h1 === undefined) {
					throw new Error("historyCounts.get(key) is undefined when it shouldn't");
				}
				historyCounts.set(key, h1 + 1);
				const h2 = historyCounts.get(key);
				if (h2 === undefined) {
					throw new Error("historyCounts.get(key) is undefined when it shouldn't");
				}
				attemptNumbers.set(submission, h2);
			}
		}
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
			{#each submissions as submission (submission.id)}
				{@const problem = contestProblems.find((p) => p.id === submission.problemId)}
				<tr
					class="submissionRow"
					onclick={() => goto(`/admin/submissions/${submission.id.toString()}`)}
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
						{:else if submission.state === 'in_review'}
							<span class="badge bg-warning">In Review</span>
						{:else if submission.state === 'correct'}
							<span class="badge bg-success">Correct</span>
						{:else if submission.state === 'incorrect'}
							<span class="badge bg-danger">Incorrect</span>
						{/if}

						{#if submission.stateReason === 'build_error'}
							<span class="badge bg-danger opacity-50">Build Error</span>
						{:else if submission.stateReason === 'time_limit_exceeded'}
							<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
						{:else if submission.stateReason === 'incorrect_overridden_as_correct'}
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
