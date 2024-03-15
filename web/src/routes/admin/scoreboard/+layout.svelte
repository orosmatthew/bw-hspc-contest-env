<script lang="ts">
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { selectedScoreboard } from './stores';

	export let data: LayoutData;

	let scoreboardSelectValue: number | null = null;

	function onScoreboardSelect() {
		console.log(scoreboardSelectValue);
		if (scoreboardSelectValue !== null) {
			goto(`/admin/scoreboard/${scoreboardSelectValue}`);
		}
	}
</script>

<svelte:head>
	<title>Admin Scoreboards</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-trophy"></i> Admin Scoreboards</h1>

<div class="d-flex flex-row-reverse gap-3 pb-2">
	<select
		class="form-select w-auto"
		bind:value={scoreboardSelectValue}
		on:change={onScoreboardSelect}
	>
		{#if $selectedScoreboard === null}
			<option value={null} selected>Select</option>
		{/if}
		{#each data.contests as contest}
			<option value={contest.id} selected={$selectedScoreboard === contest.id}
				>{contest.name}</option
			>
		{/each}
	</select>
</div>

<slot />
