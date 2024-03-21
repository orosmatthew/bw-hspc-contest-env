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
	<title>Admin Scoreboards</title>
</svelte:head>

<div class="text-end">
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary" />
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

{#if data.contest !== null}
<h2 style="text-align:center">{data.contest.name}</h2>
<div class="mb-3 row">
	<div class="text-end" />
</div>

<table class="table table-striped table-bordered">
	<thead>
		<tr>
			<th>Place</th>
			<th>Team Name</th>
			<th>Solves</th>
			<th>Time</th>
			{#each data.contest.problems as problem}
				<th>{problem.friendlyName}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.contest.teams as team, i}
			<tr>
				<td style="text-align:center; font-size:24px;"><strong>{i + 1}</strong></td>
				<td style="font-size:18px">{team.name}</td>
				<td style="font-size:18px">{team.solves}</td>
				<td style="font-size:18px">{team.time.toFixed(0)}</td>
				{#each data.contest.problems as problem}
					<td>
						<div class="row">
							<div class="col-3">
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
									/>
								{/if}
							</div>
							<div class="col-9">
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
{:else}
	<h2 class="text-center">Scoreboard - Select Contest</h2>
{/if}
