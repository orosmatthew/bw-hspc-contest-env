<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';

	export let data: PageData;

	$: data.submissions.sort((a, b) => {
		return b.createdAt.valueOf() - a.createdAt.valueOf();
	});

	let updateInterval: ReturnType<typeof setInterval> | undefined;
	let updating = false;

	onMount(() => {
		updateInterval = setInterval(async () => {
			updating = true;
			await invalidateAll();
			updating = false;
		}, 10000);
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
</script>

<svelte:head>
	<title>Submissions</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Submissions</h1>

<div class="row">
	<div class="col-8">
		<p>Rows are color coded: Red - Incorrect, Green - Correct, Yellow - In Review</p>
	</div>
	<div class="col-4 text-end">
		{#if updating}
			<div class="spinner-border spinner-border-sm text-secondary" />
		{/if}
		<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
	</div>
</div>

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
				class={(submission.state == 'InReview'
					? 'table-warning'
					: submission.state == 'Correct'
					? 'table-success'
					: submission.state == 'Incorrect'
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
