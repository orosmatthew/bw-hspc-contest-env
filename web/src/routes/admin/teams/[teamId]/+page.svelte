<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	let changingPassword = false;

	$: if (form && form.success) {
		changingPassword = false;
	}
</script>

<svelte:head>
	<title>Team</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">{data.team.name}</h1>

<a href="/admin/teams" class="mb-3 btn btn-outline-primary">All Teams</a>

<table class="table table-bordered table-striped">
	<thead>
		<tr>
			<th>Name</th>
			<th>Id</th>
			<th>Password</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>{data.team.name}</td>
			<td>{data.team.id}</td>
			<td>{data.team.password}</td>
		</tr>
	</tbody>
</table>

{#if form && !form.success}
	<div class="alert alert-danger">Invalid entry</div>
{/if}

{#if !changingPassword}
	<button
		on:click={() => {
			changingPassword = true;
		}}
		type="button"
		class="btn btn-warning">Change Password</button
	>
{:else}
	<form method="POST" action="?/password" use:enhance>
		<h4>Change Password</h4>
		<input name="password" class="form-control" />
		<div class="mt-2 row">
			<div class="text-end">
				<button
					on:click={() => {
						changingPassword = false;
					}}
					type="button"
					class="btn btn-outline-secondary">Cancel</button
				>
				<button type="submit" class="btn btn-success">Change</button>
			</div>
		</div>
	</form>
{/if}
