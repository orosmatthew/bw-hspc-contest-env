<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

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

<h1 style="text-align:center" class="mb-4">Reviews</h1>

<div class="mb-3 text-end">
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary" />
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

<ul class="list-group">
	{#if data.reviewList.length === 0}
		<div class="alert alert-success">No Submission to Review!</div>
	{/if}
	{#each data.reviewList as review}
		<a href={'/admin/diff/' + review.id.toString()} class="list-group-item list-group-item-action"
			>{review.createdAt.toLocaleDateString() + ' ' + review.createdAt.toLocaleTimeString()}</a
		>
	{/each}
</ul>
