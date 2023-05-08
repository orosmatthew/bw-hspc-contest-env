<script lang="ts">
	import { enhance } from '$app/forms';
	import { genPassword } from '../util';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	let changingPassword = false;

	$: if (form && form.success) {
		changingPassword = false;
	}

	function onGenPassword() {
		const passEntry = document.getElementById('pass_entry') as HTMLInputElement;
		passEntry.value = genPassword();
	}
</script>

<svelte:head>
	<title>Team</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">{data.team.name}</h1>

<div class="row">
	<div class="col-6">
		<a href="/admin/teams" class="mb-3 btn btn-outline-primary">All Teams</a>
	</div>
	<div class="col-6 text-end">
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
			<button type="submit" class="mb-3 btn btn-outline-danger">Delete</button>
		</form>
	</div>
</div>

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
		<input id="pass_entry" name="password" class="form-control" />
		<div class="mt-2 row">
			<div class="text-end">
				<button
					on:click={() => {
						changingPassword = false;
					}}
					type="button"
					class="btn btn-outline-secondary">Cancel</button
				>
				<button on:click={onGenPassword} type="button" class="btn btn-outline-primary"
					>Generate</button
				>
				<button type="submit" class="btn btn-success">Change</button>
			</div>
		</div>
	</form>
{/if}
