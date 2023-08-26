<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import { stretchTextarea } from '$lib/util';
	import type { Actions, PageData } from './$types';

	let editing = false;
	let error = false;

	export let data: PageData;
	export let form: Actions;

	async function deleteProblem() {
		const sure = await confirmModal.prompt('Are you sure?');
		if (!sure) {
			return;
		}
		const res = await fetch($page.url, { method: 'DELETE' });
		const data = await res.json();
		if (data.success) {
			goto('/admin/problems');
		} else {
			error = true;
		}
	}

	let confirmModal: ConfirmModal;
</script>

<ConfirmModal bind:this={confirmModal} />

<h1 style="text-align:center" class="mb-1">
	<i class="bi bi-question-circle"></i> Problem - {data.problemData.friendlyName}
</h1>

{#if error}
	<div class="alert alert-danger">
		Error deleting problem (Is it being used in any submissions?)
	</div>
{/if}

<div class="row">
	<div class="col-6">
		<a href="/admin/problems" class="btn btn-outline-primary">All Problems</a>
	</div>
	<div class="col-6 text-end">
		<button on:click={deleteProblem} type="button" class="btn btn-danger">Delete</button>
		{#if !editing}
			<button
				on:click={() => {
					if (!editing) {
						editing = true;
					}
				}}
				type="button"
				class="btn btn-warning">Edit</button
			>
		{/if}
	</div>
</div>

{#if form && !form.success}
	<div class="mt-3 alert alert-danger">Invalid edit</div>
{/if}

<form method="POST" action="?/edit">
	<div class="row justify-content-center">
		<h4 style="text-align:center" class="mt-3">Name</h4>
		<div class="col-md-auto">
			<textarea
				name="name"
				style="height:auto"
				class="form-control"
				disabled={!editing}
				use:stretchTextarea>{data.problemData.friendlyName}</textarea
			>
			<h4 style="text-align:center" class="mt-3">PascalCase Name (for filenames)</h4>
			<div class="col-md-auto">
				<input
					value={data.problemData.pascalName}
					disabled={!editing}
					name="pascalName"
					class="form-control"
				/>
			</div>
		</div>
	</div>
	<h4 style="text-align:center" class="mt-5">Sample Data</h4>
	<div class="row">
		<div class="col-6">
			<h5>Input</h5>
			<textarea
				name="sampleInput"
				style="height:auto"
				class="form-control"
				disabled={!editing}
				use:stretchTextarea>{data.problemData.sampleInput}</textarea
			>
		</div>
		<div class="col-6">
			<h5>Output</h5>
			<textarea
				name="sampleOutput"
				style="height:auto"
				class="form-control"
				disabled={!editing}
				use:stretchTextarea>{data.problemData.sampleOutput}</textarea
			>
		</div>
	</div>

	<h4 style="text-align:center" class="mt-5">Real Data</h4>
	<div class="row">
		<div class="col-6">
			<h5>Input</h5>
			<textarea
				name="realInput"
				style="height:auto"
				class="form-control"
				disabled={!editing}
				use:stretchTextarea>{data.problemData.realInput}</textarea
			>
		</div>
		<div class="col-6">
			<h5>Output</h5>
			<textarea
				name="realOutput"
				style="height:auto"
				class="form-control"
				disabled={!editing}
				use:stretchTextarea>{data.problemData.realOutput}</textarea
			>
		</div>
	</div>
	{#if editing}
		<div class="mt-3 row">
			<div class="text-end">
				<button
					type="button"
					class="btn btn-secondary"
					on:click={async () => {
						location.reload();
					}}>Cancel</button
				>
				<button type="submit" class="btn btn-success">Update</button>
			</div>
		</div>
	{/if}
</form>
