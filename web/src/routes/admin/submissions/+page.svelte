<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import SubmissionsList from '$lib/SubmissionsList.svelte';

	export let data: PageData;

	let updateInterval: ReturnType<typeof setInterval> | undefined;
	let updating = false;

	onMount(() => {
		updateInterval = setInterval(async () => {
			updating = true;
			await invalidateAll();
			updating = false;
		}, 3000);
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

{#if data.submissions != null}
	<SubmissionsList
		submissions={data.submissions}
		includesAllAttempts={true}
		sortDirection={'newest first'}
	></SubmissionsList>
{:else}
	<h2 class="text-center">Select Contest</h2>
{/if}
