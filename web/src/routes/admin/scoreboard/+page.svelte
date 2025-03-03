<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let updateInterval: ReturnType<typeof setInterval>;
	let updating = $state(false);

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

{#if data.contest !== null}
	<div class="pb-2 d-flex flex-row-reverse">
		<a
			href={`/admin/scoreboard/json/${data.contest.id}`}
			target="_blank"
			class="btn btn-outline-secondary btn-sm">JSON Export</a
		>
	</div>
{/if}

<div class="text-end">
	{#if data.frozen}
		<span class="badge bg-info">Frozen</span>
	{/if}
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary"></div>
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

{#if data.contest !== null}
	<h2 style="text-align:center">{data.contest.name}</h2>
	<div class="mb-3 row">
		<div class="text-end"></div>
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
										<a
											style="text-decoration: initial;"
											href="/admin/submissions/latest/{data.contest.id}/{team.id}/{problem.id}"
										>
											{team.problems.find((p) => {
												return p.id === problem.id;
											})?.attempts}
											{team.problems.find((p) => {
												return p.id === problem.id;
											})?.attempts === 1
												? 'Attempt'
												: 'Attempts'}</a
										><br />{#if team.problems.find((p) => {
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

<style lang="scss">
	.sticky-header {
		position: sticky;
		top: -1px;
	}
</style>
