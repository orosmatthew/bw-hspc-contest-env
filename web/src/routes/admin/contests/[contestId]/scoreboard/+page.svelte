<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import urlJoin from 'url-join';
	import correctImg from '$lib/images/correct.png';
	import incorrectImg from '$lib/images/incorrect.png';
	import type { ScoreboardTeamProblem } from '$lib/server/services/scoreboard-service';

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

{#snippet problemStatus(
	teamProblem: ScoreboardTeamProblem | undefined,
	contestId: number,
	teamId: number,
	problemId: number
)}
	<div class="row">
		<div class="col-3">
			{#if teamProblem?.graphic !== undefined}
				<img
					src={teamProblem.graphic === 'correct' ? correctImg : incorrectImg}
					alt={teamProblem.graphic === 'correct' ? 'check' : 'X'}
					width="30"
				/>
			{/if}
		</div>
		<div class="col-9">
			{#if teamProblem?.attempts}
				<a
					style="text-decoration: initial;"
					href={urlJoin(
						'/admin/contests',
						contestId.toString(),
						'/submissions/latest',
						teamId.toString(),
						problemId.toString()
					)}
				>
					{teamProblem.attempts}
					{teamProblem.attempts === 1 ? 'Attempt' : 'Attempts'}
				</a><br />
				{#if teamProblem?.min}
					<span style="color:rgb(102,102,102)">{teamProblem.min.toFixed(0)} min</span>
				{/if}
			{/if}
		</div>
	</div>
{/snippet}

{#if data.contest !== undefined}
	<div class="pb-2 d-flex flex-row-reverse">
		<a
			href={urlJoin('/admin/contests', data.contest.id.toString(), '/scoreboard/json')}
			target="_blank"
			class="btn btn-outline-secondary btn-sm"
		>
			JSON Export
		</a>
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
						{@const teamProblem = team.problems.find((p) => p.id === problem.id)}
						<td>
							{@render problemStatus(teamProblem, data.scoreboard.contest.id, team.id, problem.id)}
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
