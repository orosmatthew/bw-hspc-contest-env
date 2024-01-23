<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import FormAlert from '$lib/FormAlert.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let confirmModal: ConfirmModal;

	function enhanceConfirm(form: HTMLFormElement, text: string) {
		enhance(form, async ({ cancel }) => {
			if ((await confirmModal.prompt(text)) !== true) {
				cancel();
			}
			return async ({ update }) => {
				await update();
			};
		});
	}
</script>

<svelte:head>
	<title>Contest - {data.name}</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<h1 style="text-align:center" class="mb-4"><i class="bi bi-flag"></i> Contest - {data.name}</h1>

<FormAlert />

{#if data.activeTeams !== 0}
	<div class="alert alert-success">In Progress</div>
{/if}

<div class="row">
	<div class="col-6">
		<a href="/admin/contests" class="btn btn-outline-primary">All Contests</a>
	</div>
	<div class="col-6 text-end">
		{#if data.activeTeams === 0}
			<form
				method="POST"
				action="?/delete"
				class="d-inline"
				use:enhanceConfirm={'Are you sure you want to delete the contest? This WILL DELETE ALL DATA AND SUBMISSIONS!!'}
			>
				<button type="submit" class="btn btn-danger">Delete</button>
			</form>
			<form
				method="POST"
				action="?/repo"
				class="d-inline"
				use:enhanceConfirm={'Are you sure you want to recreate repos? This WILL DELETE ALL DATA on the repos currently.'}
			>
				<button type="submit" class="btn btn-warning">Recreate Repos</button>
			</form>
			<form
				method="POST"
				action="?/start"
				class="d-inline"
				use:enhanceConfirm={'Are you sure you want to start the contest?'}
			>
				<button type="submit" class="btn btn-success">Start</button>
			</form>
		{:else}
			<form
				method="POST"
				action="?/stop"
				class="d-inline"
				use:enhanceConfirm={'Are you sure you want to stop the contest?'}
			>
				<button type="submit" class="btn btn-outline-danger">Stop</button>
			</form>
		{/if}
	</div>
</div>

<div class="mt-3 row">
	<div class="col-6">
		<h4>Teams</h4>
		<a href={`${$page.url}/logins`} class="mb-2 btn btn-outline-secondary">Printable Logins</a>
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
				<a href={`/admin/problems/${problem.id}`} class="list-group-item list-group-item-action"
					>{problem.name}</a
				>
			{/each}
		</div>
	</div>
</div>
