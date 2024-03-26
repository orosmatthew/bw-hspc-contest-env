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
		repoModal.hide();
	}

	let confirmModal: ConfirmModal;
	let repoModal: Modal;

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

	function repoSelectNone() {
		document.querySelectorAll<HTMLInputElement>('.repoCheck').forEach((e) => {
			e.checked = false;
		});
	}

	function repoSelectAll() {
		document.querySelectorAll<HTMLInputElement>('.repoCheck').forEach((e) => {
			e.checked = true;
		});
	}
</script>

<svelte:head>
	<title>Contest - {data.name}</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<Modal title="Reset Repos" bind:this={repoModal}>
	<form action="?/repo" method="POST" use:enhance>
		<div class="modal-body">
			<div class="d-flex flex-row gap-2 pb-2">
				<button on:click={repoSelectNone} type="button" class="btn btn-sm btn-outline-secondary"
					>Select None</button
				>
				<button on:click={repoSelectAll} type="button" class="btn btn-sm btn-outline-secondary"
					>Select All</button
				>
			</div>
			{#each data.teams as team}
				<div class="form-check">
					<input
						name={`teamId${team.id}`}
						class="form-check-input repoCheck"
						type="checkbox"
						value={team.id}
						id={`repoCheck${team.id}`}
					/>
					<label class="form-check-label" for={`repoCheck${team.id}`}>{team.name}</label>
				</div>
			{/each}
		</div>
		<div class="modal-footer">
			<button
				type="button"
				class="btn btn-outline-secondary"
				on:click={() => {
					repoModal.hide();
				}}>Cancel</button
			>
			<button type="submit" class="btn btn-warning">Reset Selected</button>
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
		{#if !data.frozen}
			<form class="d-inline" action="?/freeze" method="POST" use:enhance>
				<button type="submit" class="btn btn-info">Freeze</button>
			</form>
		{:else}
			<form class="d-inline" action="?/unfreeze" method="POST" use:enhance>
				<button type="submit" class="btn btn-info">Unfreeze</button>
			</form>
		{/if}
		<button
			type="button"
			class="btn btn-outline-warning"
			on:click={() => {
				repoModal.show();
			}}>Reset Repos</button
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
				action="?/start"
				class="d-inline"
				use:enhanceConfirm={'Are you sure you want to start the contest? (THIS WILL DELETE ALL DATA IF THE CONTEST HAS ALREADY BEEN RUN)'}
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
		<a
			href={`/admin/contests/${$page.params.contestId}/logins`}
			class="mb-2 btn btn-outline-secondary">Printable Logins</a
		>
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
