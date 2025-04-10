<script lang="ts">
	import type { PageData } from './$types';
	import { contestId } from '../stores';
	import { onDestroy, onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { autoScrollEnabled } from '../+layout.svelte';
	import { page } from '$app/state';

	$contestId = parseInt(page.params.contestId);
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
		if ($autoScrollEnabled) {
			autoScrollTimeout = setTimeout(autoScroll, scrollInterval);
		}
		autoScrollEnabled.subscribe((enabled) => {
			if (enabled) {
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
			top: y + (autoScrollDir == 'down' ? 1 : -1) * scrollOffset,
			behavior: 'smooth'
		});
		if ($autoScrollEnabled) {
			autoScrollTimeout = setTimeout(autoScroll, scrollInterval);
		}
	}
</script>

<h2 style="text-align:center">{data.contest.name}</h2>
<div class="row">
	<div class="text-end"></div>
</div>

<div class="text-end mb-1">
	{#if data.frozen}
		<span class="badge bg-info">Frozen</span>
	{/if}
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary"></div>
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

<table class="table table-striped table-bordered">
	<thead class="sticky-header">
		<tr>
			<th>Place</th>
			<th>Team Name</th>
			<th>Solves</th>
			<th>Time</th>
			{#each data.contest.problems as problem (problem.id)}
				<th>{problem.friendlyName}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.contest.teams as team, i (team.id)}
			<tr>
				<td style="text-align:center; font-size:24px;"><strong>{i + 1}</strong></td>
				<td style="font-size:18px">{team.name}</td>
				<td style="font-size:18px">{team.solves}</td>
				<td style="font-size:18px">{team.time.toFixed(0)}</td>
				{#each data.contest.problems as problem (problem.id)}
					<td>
						<div class="d-flex flex-row align-items-center gap-3">
							{#if team.problems.find((p) => {
								return p.id === problem.id;
							})?.graphic !== null}
								<img
									src={team.problems.find((p) => {
										return p.id === problem.id;
									})?.graphic === 'correct'
										? '/correct.png'
										: '/incorrect.png'}
									alt="check or X"
									width="30px"
									height="30px"
								/>
							{:else}
								<div class="dummy-status-image"></div>
							{/if}
							<div class="d-flex flex-column flex-grow-1 align-items-center">
								{#if team.problems.find((p) => {
									return p.id === problem.id;
								})?.attempts !== 0}
									{team.problems.find((p) => {
										return p.id === problem.id;
									})?.attempts}
									{team.problems.find((p) => {
										return p.id === problem.id;
									})?.attempts === 1
										? 'Attempt'
										: 'Attempts'}<br />{#if team.problems.find((p) => {
										return p.id === problem.id;
									})?.min}<span style="color:rgb(102,102,102)"
											>{team.problems
												.find((p) => {
													return p.id === problem.id;
												})
												?.min?.toFixed(0)} min</span
										>{/if}
								{/if}
							</div>
						</div>
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
