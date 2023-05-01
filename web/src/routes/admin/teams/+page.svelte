<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	let adding = false;
	let deleting = false;

	$: if (form && form.success) {
		adding = false;
		deleting = false;
	}
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Teams</h1>

{#if form && !form.success}
	<div class="alert alert-danger">Invalid action</div>
{/if}

<div class="row mb-3">
	<div class="text-end">
		{#if !deleting}
			<button
				on:click={() => {
					deleting = true;
				}}
				type="button"
				class="btn btn-outline-danger">Delete</button
			>
		{:else}
			<button
				on:click={() => {
					deleting = false;
				}}
				type="button"
				class="btn btn-outline-danger">Cancel</button
			>
		{/if}
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

<div class="list-group">
	{#each data.teams as team}
		<a href={'/admin/teams/' + team.id.toString()} class="list-group-item list-group-item-action">
			<div class="row">
				<div class="col-6">
					{team.name}
				</div>
				<div class="col-6">
					{#if deleting}
						<form method="POST" action="?/delete" use:enhance>
							<div class="text-end">
								<input type="hidden" value={team.id} name="teamId" />
								<button type="submit" class="btn btn-danger">Delete</button>
							</div>
						</form>
					{/if}
				</div>
			</div>
		</a>
	{/each}
</div>
