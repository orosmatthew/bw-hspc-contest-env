<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	export let data: PageData;

	let updateInterval: ReturnType<typeof setInterval>;
	let updating = false;

	onMount(() => {
		updateInterval = setInterval(async () => {
			updating = true;
			await invalidateAll();
			updating = false;
		}, 10000);
	});

	onDestroy(() => {
		clearInterval(updateInterval);
	});
</script>

<svelte:head>
	<title>Admin Scoreboard</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Admin Scoreboard</h1>

<div class="mb-3 row">
	<div class="text-end">
		{#if updating}
			<div class="spinner-border spinner-border-sm text-secondary" />
		{/if}
		<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
	</div>
</div>

<table class="table table-striped table-bordered">
	<thead>
		<tr>
			<th>Team Name</th>
			{#each data.problems as problem}
				<th>{problem.friendlyName}</th>
			{/each}
			<th>Total Correct</th>
			<th>Total Points</th>
		</tr>
	</thead>
	<tbody>
		{#each data.teams as team}
			<tr>
				<td>{team.name}</td>
				{#each data.problems as _}
					<td>-/-</td>
				{/each}
				<td>0</td>
				<td>0</td>
			</tr>
		{/each}
	</tbody>
</table>
