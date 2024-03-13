<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import FormAlert from '$lib/FormAlert.svelte';
	import Modal from '$lib/Modal.svelte';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	$: if (form) {
		freezeModal.hide();
	}

	let confirmModal: ConfirmModal;
	let freezeModal: Modal;

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

	let freezeTimeInputLocal: string | undefined;
	let freezeTimeInput: string | null = null;
	$: if (freezeTimeInputLocal !== undefined) {
		freezeTimeInput = new Date(freezeTimeInputLocal).toISOString();
	}
</script>

<svelte:head>
	<title>Contest - {data.name}</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<Modal title="Freeze Time" bind:this={freezeModal}>
	<form action="?/freeze-time" method="POST" use:enhance>
		<div class="modal-body">
			<label class="form-label" for="freezeTimeInput">Freeze At</label>
			<input
				bind:value={freezeTimeInputLocal}
				id="freezeTimeInput"
				class="form-control"
				type="datetime-local"
			/>
			<input type="hidden" name="freezeTime" value={freezeTimeInput} />
		</div>
		<div class="modal-footer">
			<button
				type="button"
				class="btn btn-outline-secondary"
				on:click={() => {
					freezeModal.hide();
				}}>Cancel</button
			>
			<button type="submit" class="btn btn-success">Set</button>
		</div>
	</form>
</Modal>

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
		<button
			type="button"
			class="btn btn-outline-info"
			on:click={() => {
				freezeModal.show();
			}}>Set Freeze Time</button
		>
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
