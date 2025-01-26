<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import FormAlert from '$lib/FormAlert.svelte';
	import Modal from '$lib/Modal.svelte';
	import type { Actions, PageData } from './$types';
	import { genPassword } from './util';

	interface Props {
		data: PageData;
		form: Actions;
	}

	let { data, form }: Props = $props();

	function editGenPassword() {
		(document.getElementById('editTeamPassword') as HTMLInputElement).value = genPassword();
	}

	let addModal: Modal | undefined = $state();
	let confirmModal: ConfirmModal | undefined = $state();
	let editModal: Modal | undefined = $state();

	let editTeam: PageData['teams'][number] | undefined = $state();
	$effect(() => {
		if (form) {
			addModal?.hide();
			editModal?.hide();
			confirmModal?.cancel();
		}
	});
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<FormAlert />
<ConfirmModal bind:this={confirmModal} />

<Modal title="Edit Team" bind:this={editModal}>
	<form
		action="?/edit"
		method="POST"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: false });
			};
		}}
	>
		<div class="modal-body">
			{#key editTeam}
				{#if editTeam !== undefined}
					<input type="hidden" name="id" value={editTeam.id} />

					<label class="form-label" for="editTeamName">Name</label>
					<input
						name="name"
						id="editTeamName"
						type="text"
						class="form-control"
						value={editTeam.name}
						required
					/>

					<label class="mt-1 form-label" for="editTeamLang">Language</label>
					<select
						id="editTeamLang"
						name="lang"
						class="form-select"
						value={editTeam.language}
						required
					>
						<option value="Java">Java</option>
						<option value="CSharp">C#</option>
						<option value="CPP">C++</option>
						<option value="Python">Python</option>
					</select>

					<label class="mt-1 form-label" for="editTeamPassword">Password</label>
					<div class="input-group">
						<input
							name="password"
							id="editTeamPassword"
							type="text"
							class="form-control"
							value={editTeam.password}
							required
						/>
						<button
							type="button"
							onclick={editGenPassword}
							class="btn btn-outline-primary"
							aria-label="generate password"><i class="bi bi-arrow-clockwise"></i></button
						>
					</div>
				{/if}
			{/key}
		</div>
		<div class="modal-footer">
			<button
				onclick={() => {
					editModal?.hide();
				}}
				type="button"
				class="btn btn-secondary">Cancel</button
			>
			<button type="submit" class="btn btn-warning">Submit Changes</button>
		</div>
	</form>
</Modal>

<Modal title="Add Team" bind:this={addModal}>
	<form action="?/add" method="POST" use:enhance>
		<div class="modal-body">
			<label class="form-label" for="addTeamName">Name</label>
			<input name="name" id="addTeamName" type="text" class="form-control" required />
			<label class="mt-1 form-label" for="addTeamLang">Language</label>
			<select id="addTeamLang" name="lang" class="form-select" required>
				<option value="Java">Java</option>
				<option value="CSharp">C#</option>
				<option value="CPP">C++</option>
				<option value="Python">Python</option>
			</select>
		</div>
		<div class="modal-footer">
			<button
				onclick={() => {
					addModal?.hide();
				}}
				type="button"
				class="btn btn-secondary">Cancel</button
			>
			<button type="submit" class="btn btn-success">Add</button>
		</div>
	</form>
</Modal>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-people"></i> Teams</h1>

<div class="row mb-3">
	<div class="text-end">
		<button
			onclick={() => {
				addModal?.show();
			}}
			type="button"
			class="btn btn-success">Add</button
		>
	</div>
</div>

<div class="table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Language</th>
				<th>Password</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.teams as team}
				<tr>
					<td>{team.id}</td>
					<td>{team.name}</td>
					<td
						><span
							class="badge"
							class:bg-warning={team.language === 'Java'}
							class:bg-success={team.language === 'CSharp'}
							class:bg-info={team.language === 'CPP'}
							class:bg-primary={team.language === 'Python'}
						>
							{team.language}</span
						></td
					>
					<td><code>{team.password}</code></td>
					<td>
						<button
							aria-label="edit"
							onclick={() => {
								editTeam = team;
								editModal?.show();
							}}
							class="btn btn-sm btn-outline-warning"><i class="bi bi-pencil-square"></i></button
						>
						<form
							action="?/delete"
							class="d-inline"
							method="POST"
							use:enhance={async ({ cancel }) => {
								if (confirmModal === undefined) {
									console.error('confirmModal is undefined, aborting');
									cancel();
									return;
								}
								if (
									!(await confirmModal.prompt(`Are you sure you want to delete team ${team.name}?`))
								) {
									cancel();
								}
								return async ({ update }) => {
									await update();
								};
							}}
						>
							<input type="hidden" name="teamId" value={team.id} />
							<button type="submit" class="btn btn-sm btn-danger" aria-label="delete"
								><i class="bi bi-trash3"></i></button
							>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
