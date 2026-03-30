<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import urlJoin from 'url-join';
	import correctImg from '$lib/images/correct.png';
	import incorrectImg from '$lib/images/incorrect.png';

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

{#if data.contest !== undefined}
	<div class="pb-2 d-flex flex-row-reverse">
		<a
			href={urlJoin('/admin/contests', data.contest.id.toString(), '/scoreboard/json')}
			target="_blank"
			class="btn btn-outline-secondary btn-sm">JSON Export</a
		>
	</div>
{/if}

{#if data.scoreboard !== undefined}
	<div class="d-flex flex-row justify-content-end gap-1">
		{#if data.scoreboard.isFrozen}
			<span class="badge bg-info">Frozen</span>
		{/if}
		{#if updating}
			<div class="spinner-border spinner-border-sm text-secondary"></div>
		{/if}
		<strong>Last Updated:</strong><span>{data.scoreboard.timestamp.toLocaleTimeString()}</span>
	</div>
{/if}

{#if data.scoreboard !== undefined}
	<h2 style="text-align:center">{data.scoreboard.contest.name}</h2>
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
						<td>
							<div class="row">
								<div class="col-3">
									{#if team.problems.find((p) => {
										return p.id === problem.id;
									})?.graphic !== undefined}
										<img
											src={team.problems.find((p) => {
												return p.id === problem.id;
											})?.graphic === 'correct'
												? correctImg
												: incorrectImg}
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
											href={urlJoin(
												'/admin/contests',
												data.scoreboard.contest.id.toString(),
												'/submissions/latest',
												team.id.toString(),
												problem.id.toString()
											)}
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
	<h2 class="text-center">No Scoreboard Data</h2>
{/if}

<style lang="scss">
	.sticky-header {
		position: sticky;
		top: -1px;
	}
</style>
