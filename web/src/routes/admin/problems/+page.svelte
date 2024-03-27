<script lang="ts">
	import type { Actions, PageData } from './$types';
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import Modal from '$lib/Modal.svelte';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: Actions;

	let modalElement: HTMLDivElement;
	let inputSpecModal: Modal;

	$: if (form) {
		inputSpecModal.hide();
	}
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
						class="btn btn-link btn-sm pt-0 pb-0"
						on:click={() => {
							inputSpecModal.show();
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
	<div class="modal-body">
		<p>
			<i><b>Optional</b></i> description the structure of a single input case for a specific problem as a semicolon-separated
			list of instructions to consume lines. (Only used for showing seprated input cases alongside team outputs.)
		</p>
		<div>
			These instructions take 2 forms:
			<ul>
				<li>"<b>C</b><i>n</i>" = Consume exactly <i>n</i> lines.</li>
				<ul>
					<li><b>C3</b> consumes 3 lines.</li>
				</ul>
				<li>
					"<b>T</b><i>n</i>" = Read the <i>n</i><sup>th</sup> Token on the current line, parse it as
					a number, then consume the current line plus <i>n</i> additional lines.
				</li>
				<ul>
					<li>
						If the first line of an input case is a "5" indicating 5 lines will follow, then <b>T0</b> will
						consume the line with the "5" <i>and</i> the 5 lines afterward.
					</li>
					<li>
						<b>T1</b> is used when an input line like "Name 7" means to consume the following 7 lines.
					</li>
				</ul>
			</ul>
		</div>
		<div>
			The parsing starts from the first line of an input case, with each instruction adjusting the
			'current line'. Some problems will require multiple instructions to parse a case.
			<ul>
				<li><b>T0;C2</b> means the first line of the case indicates a number of lines to follow, and then after that there's exactly 2 more lines.</li>
				<li><b>C2;T0</b> means the case always begins with 2 lines, <i>then</i> a line with a number indicating how many lines will follow that.</li>
		</div>
	</div>
	<div class="modal-footer">
		<button
			on:click={() => {
				inputSpecModal.hide();
			}}
			type="button"
			class="btn btn-secondary">Close</button
		>
	</div>
</Modal>

<style>
	.inputSpec {
		font-family: monospace;
	}

	.inputSpecMissing {
		font-style: italic;
	}
</style>
