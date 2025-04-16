<script lang="ts" module>
	export const autoScrollEnabled = writable<boolean>(false);
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { theme } from '../../stores';
	import type { PageData } from './$types';
	import { contestId } from './stores';
	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	function onContestSelect() {
		if ($contestId != null) {
			goto(`/public/scoreboard/${$contestId}`);
		}
	}
</script>

<svelte:head>
	<title>Public Scoreboard</title>
</svelte:head>

<div class="mx-5 mt-2">
	<div class="row mt-2">
		<div class="col d-flex flex-row-reverse gap-3">
			<button
				onclick={() => {
					$theme = $theme === 'light' ? 'dark' : 'light';
				}}
				type="button"
				aria-label="theme"
				class="btn btn-outline-secondary"
				><i class={`bi bi-${$theme == 'light' ? 'sun' : 'moon'}`}></i></button
			>
			<div class="form-check form-switch align-self-center">
				<input
					bind:checked={$autoScrollEnabled}
					class="form-check-input"
					type="checkbox"
					role="switch"
					id="autoScrollCheck"
				/>
				<label class="form-check-label" for="autoScrollCheck">AutoScroll</label>
			</div>
			<div class="d-flex flex-row gap-2">
				<label class="form-label mt-auto mb-auto" for="scoreboardSelect">Scoreboard</label>
				<select
					bind:value={$contestId}
					onchange={onContestSelect}
					id="scoreboardSelect"
					class="form-control form-select w-auto"
				>
					{#if $contestId === null}
						<option value={null}>None</option>
					{/if}
					{#each data.contests as contest (contest.id)}
						<option selected={contest.id === $contestId} value={contest.id}>{contest.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
	{@render children?.()}
</div>
