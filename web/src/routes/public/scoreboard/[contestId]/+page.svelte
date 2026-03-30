<script lang="ts">
	import type { PageData } from './$types';
	import { contestId } from '../stores';
	import { onDestroy, onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { autoScrollEnabled } from '../+layout.svelte';
	import { page } from '$app/state';
	import correctImg from '$lib/images/correct.png';
	import incorrectImg from '$lib/images/incorrect.png';
	import type { ScoreboardTeamProblem } from '$lib/server/services/scoreboard-service';

	$contestId = page.params.contestId === undefined ? null : parseInt(page.params.contestId);
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let updateInterval: ReturnType<typeof setInterval>;
	let updating = $state(false);

	const scrollInterval = 10000;

	let autoScrollTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		updateInterval = setInterval(async () => {
			updating = true;
			await invalidateAll();
			updating = false;
		}, 10000);
		if ($autoScrollEnabled === true) {
			autoScrollTimeout = setTimeout(autoScroll, scrollInterval);
		}
		autoScrollEnabled.subscribe((enabled) => {
			if (enabled === true) {
				autoScroll();
			}
		});
	});

	onDestroy(() => {
		clearInterval(updateInterval);
		if (autoScrollTimeout !== null) {
			clearTimeout(autoScrollTimeout);
		}
	});

	type AutoScrollDir = 'up' | 'down';
	let autoScrollDir: AutoScrollDir = 'down';
	function autoScroll() {
		let scrollOffset = window.innerHeight / 2;
		let y = window.scrollY;
		let height = document.body.scrollHeight - window.innerHeight;

		if (autoScrollDir === 'down' && y >= height) {
			autoScrollDir = 'up';
		} else if (autoScrollDir === 'up' && y <= 0) {
			autoScrollDir = 'down';
		}
		window.scrollTo({
			top: y + (autoScrollDir === 'down' ? 1 : -1) * scrollOffset,
			behavior: 'smooth'
		});
		if ($autoScrollEnabled === true) {
			autoScrollTimeout = setTimeout(autoScroll, scrollInterval);
		}
	}
</script>

{#snippet problemStatus(teamProblem: ScoreboardTeamProblem | undefined)}
	<div class="d-flex flex-row align-items-center gap-3">
		{#if teamProblem?.graphic !== undefined}
			<img
				src={teamProblem.graphic === 'correct' ? correctImg : incorrectImg}
				alt={teamProblem.graphic === 'correct' ? 'check' : 'X'}
				width="30"
				height="30"
			/>
		{:else}
			<div class="dummy-status-image"></div>
		{/if}
		<div class="d-flex flex-column flex-grow-1 align-items-center">
			{#if teamProblem?.attempts}
				{teamProblem.attempts}
				{teamProblem.attempts === 1 ? 'Attempt' : 'Attempts'}<br />
				{#if teamProblem?.min}
					<span style="color:rgb(102,102,102)">{teamProblem.min.toFixed(0)} min</span>
				{/if}
			{/if}
		</div>
	</div>
{/snippet}

<h2 style="text-align:center">{data.scoreboard.contest.name}</h2>
<div class="row">
	<div class="text-end"></div>
</div>

<div class="text-end mb-1">
	{#if data.scoreboard.isFrozen}
		<span class="badge bg-info">Frozen</span>
	{/if}
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary"></div>
	{/if}
	<strong>Last Updated: </strong>{data.scoreboard.timestamp.toLocaleTimeString()}
</div>

<table class="table table-striped table-bordered">
	<thead class="sticky-header">
		<tr>
			<th>Place</th>
			<th>Team Name</th>
			<th>Solves</th>
			<th>Time</th>
			{#each data.scoreboard.contest.problems as problem (problem.id)}
				<th>{problem.friendlyName}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.scoreboard.contest.teams as team, i (team.id)}
			<tr>
				<td style="text-align:center; font-size:24px;"><strong>{i + 1}</strong></td>
				<td style="font-size:18px">{team.name}</td>
				<td style="font-size:18px">{team.solves}</td>
				<td style="font-size:18px">{team.time.toFixed(0)}</td>
				{#each data.scoreboard.contest.problems as problem (problem.id)}
					{@const teamProblem = team.problems.find((p) => p.id === problem.id)}
					<td>
						{@render problemStatus(teamProblem)}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style lang="scss">
	.sticky-header {
		position: sticky;
		top: -1px;
	}

	.dummy-status-image {
		width: 30px;
		height: 30px;
	}
</style>
