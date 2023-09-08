<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	let adding = false;

	$: if (form && form.success) {
		adding = false;
	}
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-people"></i> Teams</h1>

{#if form && !form.success}
	<div class="alert alert-danger">Invalid action</div>
{/if}

<div class="row mb-3">
	<div class="text-end">
		{#if !adding}
			<button
				on:click={() => {
					adding = true;
				}}
				type="button"
				class="btn btn-outline-success">Add</button
			>
		{/if}
	</div>
</div>

{#if adding}
	<form class="mb-3" method="POST" action="?/add" use:enhance>
		<h5>Name</h5>
		<input id="name" name="name" class="form-control" />
		<div class="mt-3 row">
			<div class="text-end">
				<button
					on:click={() => {
						adding = false;
					}}
					type="button"
					class="btn btn-outline-secondary">Cancel</button
				>
				<button type="submit" class="btn btn-success">Add</button>
			</div>
		</div>
	</form>
{/if}

<div class="table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.teams as team}
				<tr>
					<td>{team.id}</td>
					<td>{team.name}</td>
					<td
						><a href={`/admin/teams/${team.id.toString()}`} class="btn btn-sm btn-outline-secondary"
							>Details</a
						></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
