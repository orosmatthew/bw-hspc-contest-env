<script lang="ts">
	import { SubmissionState } from '@prisma/client';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: data.submissions.sort((a, b) => {
		return b.createdAt.valueOf() - a.createdAt.valueOf();
	});
</script>

<svelte:head>
	<title>Submissions</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Submissions</h1>

<p>Rows are color coded: Red - Incorrect, Green - Correct, Yellow - In Review</p>

<table class="table table-bordered table-hover">
	<thead>
		<tr>
			<th>Team</th>
			<th>Problem</th>
			<th>Submit Time</th>
			<th>Graded Time</th>
			<th>Message</th>
		</tr>
	</thead>
	<tbody>
		{#each data.submissions as submission}
			<tr
				on:click={() => {
					goto('/admin/submissions/' + submission.id.toString());
				}}
				class={(submission.state == SubmissionState.InReview
					? 'table-warning'
					: submission.state == SubmissionState.Correct
					? 'table-success'
					: submission.state == SubmissionState.Incorrect
					? 'table-danger'
					: '') + ' submission-row'}
			>
				<td>
					{#if submission.teamName}
						{submission.teamName}
					{/if}
				</td>
				<td>
					{#if submission.problemName}
						{submission.problemName}
					{/if}
				</td>
				<td
					>{submission.createdAt.toLocaleDateString() +
						' ' +
						submission.createdAt.toLocaleTimeString()}</td
				>
				<td>
					{#if submission.gradedAt}
						{submission.gradedAt.toLocaleDateString() +
							' ' +
							submission.gradedAt.toLocaleTimeString()}
					{/if}
				</td>
				<td>{submission.message ? submission.message : ''}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.submission-row:hover {
		cursor: pointer;
	}
</style>
