<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;
</script>

<svelte:head>
	<title>{data.name}</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">{data.name}</h1>

{#if data.activeTeams !== 0}
	<div class="alert alert-success">In Progress</div>
{/if}

{#if form && !form.success}
	<div class="alert alert-danger">An error occured</div>
{/if}

<div class="row">
	<div class="col-6">
		<a href="/admin/contests" class="btn btn-outline-primary">All Contests</a>
	</div>
	<div class="col-6 text-end">
		<form
			method="POST"
			use:enhance={({ cancel }) => {
				if (!confirm('Are you sure?')) {
					cancel();
				}
				return async ({ update }) => {
					update();
				};
			}}
		>
			{#if data.activeTeams === 0}
				<button type="submit" formaction="?/delete" class="btn btn-danger">Delete</button>
				<button type="submit" formaction="?/repo" class="btn btn-warning">Recreate Repos</button>
				<button type="submit" formaction="?/start" class="btn btn-success">Start</button>
			{:else}
				<button type="submit" formaction="?/stop" class="btn btn-outline-danger">Stop</button>
			{/if}
		</form>
	</div>
</div>

<div class="mt-3 row">
	<div class="col-6">
		<h4>Teams</h4>
		<div class="list-group">
			{#each data.teams as team}
				<a href={`/admin/teams/${team.id}`} class="list-group-item list-group-item-action"
					>{team.name}</a
				>
			{/each}
		</div>
	</div>
	<div class="col-6">
		<h4>Problems</h4>
		<div class="list-group">
			{#each data.problems as problem}
				<a href={`/admin/problems/${problem.id}`} class="list-group-item list-group-item-action"
					>{problem.name}</a
				>
			{/each}
		</div>
	</div>
</div>
