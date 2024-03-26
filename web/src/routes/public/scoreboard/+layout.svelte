<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '../../stores';
	import type { PageData } from './$types';
	import { contestId } from './stores';
	export let data: PageData;

	function onContestSelect() {
		if ($contestId != null) {
			goto(`/public/scoreboard/${$contestId}`);
		}
	}
</script>

<svelte:head>
	<title>Public Scoreboard</title>
</svelte:head>

<div class="row mt-2">
	<div class="col d-flex flex-row-reverse gap-3">
		<button
			on:click={() => {
				$theme = $theme === 'light' ? 'dark' : 'light';
			}}
			type="button"
			aria-label="theme"
			class="btn btn-outline-secondary"
			><i class={`bi bi-${$theme == 'light' ? 'sun' : 'moon'}`} /></button
		>
		<div class="d-flex flex-row gap-2">
			<label class="form-label mt-auto mb-auto" for="scoreboardSelect">Scoreboard</label>
			<select
				bind:value={$contestId}
				on:change={onContestSelect}
				id="scoreboardSelect"
				class="form-control form-select w-auto"
			>
				{#if $contestId === null}
					<option value={null}>None</option>
				{/if}
				{#each data.contests as contest}
					<option selected={contest.id === $contestId} value={contest.id}>{contest.name}</option>
				{/each}
			</select>
		</div>
	</div>
</div>
<slot />
