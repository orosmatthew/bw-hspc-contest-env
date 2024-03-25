<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import SubmissionsList from '$lib/SubmissionsList.svelte';

	export let data: PageData;

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
	<title>Reviews</title>
</svelte:head>

<div class="mb-3 text-end">
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary" />
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

<h1 style="text-align:center" class="mb-1">
	<i class="bi bi-eye"></i> Pending Reviews ({data.reviewList.length})
</h1>

{#if data.reviewList.length === 0}
	<ul class="list-group">
		<div class="alert alert-success">No Submission to Review!</div>
	</ul>
{:else}
	<SubmissionsList submissions={data.reviewList}></SubmissionsList>
{/if}

<h1 style="text-align:center" class="mb-1">
	<i class="bi bi-eye"></i> Queued Submissions ({data.queueList.length})
</h1>

{#if data.queueList.length === 0}
	<ul class="list-group">
		<div class="alert alert-success">No Queued Submissions!</div>
	</ul>
{:else}
	<SubmissionsList submissions={data.queueList}></SubmissionsList>
{/if}
