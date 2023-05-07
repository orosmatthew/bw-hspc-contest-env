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

{#if form && !form.success}
	<div class="alert alert-danger">An error occured</div>
{/if}

<div class="row">
	<div class="col-6">
		<a href="/admin/contests" class="btn btn-outline-primary">All Contests</a>
	</div>
	<div class="col-6">
		<div class="text-end">
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm('Are you sure?')) {
						cancel();
					}
					return async ({ update }) => {
						update();
					};
				}}
			>
				<button type="submit" class="btn btn-danger">Delete</button>
			</form>
		</div>
	</div>
</div>

<div class="mt-3 row">
	<div class="col-6">
		<h4>Teams</h4>
		<div class="list-group">
			{#each data.teams as team}
				<div class="list-group-item">{team.name}</div>
			{/each}
		</div>
	</div>
	<div class="col-6">
		<h4>Problems</h4>
		<div class="list-group">
			{#each data.problems as problem}
				<div class="list-group-item">{problem.name}</div>
			{/each}
		</div>
	</div>
</div>
