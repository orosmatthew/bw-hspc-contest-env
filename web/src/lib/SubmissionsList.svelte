<script lang="ts">
	import { goto } from '$app/navigation';
	import TestCaseResults from '$lib/TestCaseResults.svelte';
	import {
		SubmissionState,
		type Contest,
		type Problem,
		type Submission,
		type Team
	} from '@prisma/client';
	import {
		minutesBetweenTimestamps,
		minutesFromContestStart,
		submissionTimestampHoverText
	} from '$lib/util';

	export let submissions: (Submission & { contest: Contest; team: Team; problem: Problem })[];
	export let includesAllAttempts = false;

	const allQueued: boolean =
		submissions.find((s) => s.state != SubmissionState.Queued) === undefined;

	const showOutputColumns = !allQueued;

	let historyCounts = new Map<string, number>();
	let attemptNumbers = new Map<Submission, number>();

	function getAttemptText(submission: Submission): string {
		return `#${attemptNumbers.get(submission) ?? -1} / ${historyCounts.get(getSubmissionHistoryKey(submission)) ?? -1}`;
	}

	function getSubmissionHistoryKey(submission: Submission): string {
		return `${submission.contestId};${submission.teamId};${submission.problemId}`;
	}

	$: {
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

				historyCounts.set(key, historyCounts.get(key)! + 1);
				attemptNumbers.set(submission, historyCounts.get(key)!);
			}
		}
	}
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
			{#each submissions as submission}
				<tr
					class="submissionRow"
					on:click={() => goto(`/admin/submissions/${submission.id.toString()}`)}
				>
					<td>
						{#if submission.team.name}
							{submission.team.name}<br />
						{/if}
					</td>
					<td>
						{#if submission.problem}
							{submission.problem.friendlyName}
						{/if}
					</td>
					{#if includesAllAttempts}
						<td>
							<span>{getAttemptText(submission)}</span>
						</td>
					{/if}
					<td>
						{#if submission.state === 'Queued'}
							<span class="badge bg-secondary">Queued</span>
						{:else if submission.state === 'InReview'}
							<span class="badge bg-warning">In Review</span>
						{:else if submission.state === 'Correct'}
							<span class="badge bg-success">Correct</span>
						{:else if submission.state === 'Incorrect'}
							<span class="badge bg-danger">Incorrect</span>
						{/if}

						{#if submission.stateReason === 'BuildError'}
							<span class="badge bg-danger opacity-50">Build Error</span>
						{:else if submission.stateReason === 'TimeLimitExceeded'}
							<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
						{:else if submission.stateReason === 'IncorrectOverriddenAsCorrect'}
							<span class="badge bg-success opacity-50">Manually Graded</span>
						{/if}
					</td>
					{#if showOutputColumns}
						<td>
							{#key submission.testCaseResults}
								<TestCaseResults problem={submission.problem} {submission} condensed={true} />
							{/key}
						</td>
						<td>
							{submission.runtimeMilliseconds ? `${submission.runtimeMilliseconds} ms` : ''}
						</td>
					{/if}
					<td>
						<span title={submissionTimestampHoverText(submission.contest, submission)}>
							{Math.ceil(minutesFromContestStart(submission.contest, submission.createdAt))} min
						</span>
					</td>
					<td>
						{#if submission.gradedAt}
							+{Math.ceil(minutesFromContestStart(submission.contest, submission.gradedAt)) -
								Math.ceil(minutesFromContestStart(submission.contest, submission.createdAt))} min
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