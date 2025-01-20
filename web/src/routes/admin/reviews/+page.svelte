<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import SubmissionsList from '$lib/SubmissionsList.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let updateInterval: ReturnType<typeof setInterval> | undefined;
	let updating = $state(false);

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

{#if data.reviewList != null}
	<div class="mb-3 text-end">
		{#if updating}
			<div class="spinner-border spinner-border-sm text-secondary"></div>
		{/if}
		<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
	</div>

	<h1 style="text-align:center" class="pb-2">
		<i class="bi bi-eye"></i> Pending Reviews ({data.reviewList.length})
	</h1>

	{#if data.reviewList.length === 0}
		<ul class="list-group">
			<div class="alert alert-success">No Submission to Review!</div>
		</ul>
	{:else}
		<SubmissionsList submissions={data.reviewList} sortDirection={'oldest first'}></SubmissionsList>
	{/if}

	<h1 style="text-align:center" class="pb-2">
		<i class="bi bi-eye"></i> Queued Submissions ({data.queueList.length})
	</h1>

	{#if data.queueList.length === 0}
		<ul class="list-group">
			<div class="alert alert-success">No Queued Submissions!</div>
		</ul>
	{:else}
		<SubmissionsList submissions={data.queueList} sortDirection={'oldest first'}></SubmissionsList>
	{/if}
{:else}
	<h2 class="text-center">Select Contest</h2>
{/if}
