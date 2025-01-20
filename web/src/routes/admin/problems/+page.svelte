<script lang="ts">
	import type { Actions, PageData } from './$types';
	import Modal from '$lib/Modal.svelte';
	import InputSpecDescription from './InputSpecDescription.svelte';

	interface Props {
		data: PageData;
		form: Actions;
	}

	let { data, form }: Props = $props();

	let inputSpecModal: Modal | undefined = $state();

	$effect(() => {
		if (form) {
			inputSpecModal?.hide();
		}
	});
</script>

<svelte:head>
	<title>Problems</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-question-circle"></i> Problems</h1>

<div class="row mb-3">
	<div class="text-end">
		<a href="/admin/problems/create" class="btn btn-outline-success">Create</a>
	</div>
</div>

{#if data.problems.length === 0}
	<div class="alert alert-warning">No problems</div>
{/if}

<div class="table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th
					>Input Spec <button
						aria-label="info"
						class="btn btn-link btn-sm pt-0 pb-0"
						onclick={() => {
							inputSpecModal?.show();
						}}><i class="bi bi-info-circle"></i></button
					></th
				>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.problems as problem}
				<tr>
					<td>{problem.id}</td>
					<td>{problem.friendlyName}</td>
					<td>
						{#if problem.inputSpec != null}
							{problem.parsedInput.success ? '✅' : '❌'}
							<span class="inputSpec">{problem.inputSpec}</span>
						{:else}
							<span class="inputSpecMissing">none</span>
						{/if}
					</td><td
						><a
							href={`/admin/problems/${problem.id.toString()}`}
							class="btn btn-sm btn-outline-secondary">Details</a
						></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<Modal title="Input Spec" bind:this={inputSpecModal}>
	<InputSpecDescription {inputSpecModal} />
</Modal>

<style>
	.inputSpec {
		font-family: monospace;
	}

	.inputSpecMissing {
		font-style: italic;
	}
</style>
