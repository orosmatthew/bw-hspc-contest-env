<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import SubmissionsList from '$lib/SubmissionsList.svelte';

	export let data: PageData;
	const sortedSubmissions = data.submissions.toSorted(
		(s1, s2) => s2.createdAt.getTime() - s1.createdAt.getTime()
	);

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

<div class="mb-3 text-end">
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary" />
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-envelope-paper"></i> Submissions</h1>

<SubmissionsList submissions={sortedSubmissions} includesAllAttempts={true}></SubmissionsList>
