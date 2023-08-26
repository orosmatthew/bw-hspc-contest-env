<script lang="ts">
	import type { Actions, PageData } from './$types';
	import { onMount } from 'svelte';
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { enhance } from '$app/forms';
	import { stretchTextarea } from '$lib/util';
	import ConfirmModal from '$lib/ConfirmModal.svelte';

	export let data: PageData;
	export let form: Actions;

	onMount(() => {
		if (data.diff) {
			const diffElement = document.getElementById('diff');
			if (diffElement) {
				const diff2htmlUi = new Diff2HtmlUI(diffElement, data.diff, {
					drawFileList: false,
					matching: 'lines',
					diffStyle: 'char',
					outputFormat: 'side-by-side',
					highlight: false,
					fileContentToggle: false
				});
				diff2htmlUi.draw();
			}
		}
	});

	let confirmModal: ConfirmModal;
</script>

<svelte:head>
	<title>Submission</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<h1 style="text-align:center" class="mb-4">Submission</h1>

{#if form && !form.success}
	<div class="alert alert-danger">Error</div>
{/if}

<div class="row">
	<div class="col-6">
		<a href="/admin/submissions" class="mb-3 btn btn-outline-primary">All Submissions</a>
	</div>
	<div class="col-6 text-end">
		<form
			method="POST"
			action="?/delete"
			use:enhance={async ({ cancel }) => {
				if ((await confirmModal.prompt('Are you sure?')) !== true) {
					cancel();
				}
				return async ({ update }) => {
					await update();
				};
			}}
		>
			<button type="submit" class="btn btn-danger">Delete</button>
		</form>
	</div>
</div>

<table class="table table-bordered">
	<thead>
		<tr>
			<th>Team</th>
			<th>Problem</th>
			<th>Submit Time</th>
			<th>Graded Time</th>
			<th>Message</th>
		</tr>
	</thead>
	<tbody>
		<tr
			class={(data.state == 'InReview'
				? 'table-warning'
				: data.state == 'Correct'
				? 'table-success'
				: data.state == 'Incorrect'
				? 'table-danger'
				: '') + ' submission-row'}
		>
			<td>
				{#if data.teamName}
					{data.teamName}
				{/if}
			</td>
			<td>
				{#if data.problemName}
					{data.problemName}
				{/if}
			</td>
			<td>{data.submitTime.toLocaleDateString() + ' ' + data.submitTime.toLocaleTimeString()}</td>
			<td>
				{#if data.gradedTime}
					{data.gradedTime.toLocaleDateString() + ' ' + data.gradedTime.toLocaleTimeString()}
				{/if}
			</td>
			<td>{data.message ? data.message : ''}</td>
		</tr>
	</tbody>
</table>

{#if data.state == 'InReview'}
	<div class="row">
		<div class="text-center">
			<a href={'/admin/diff/' + data.id} class="btn btn-warning">Review Submission</a>
		</div>
	</div>
{:else if data.state == 'Incorrect'}
	<h3 style="text-align:center">Output</h3>
	<textarea use:stretchTextarea class="code mb-3 form-control" disabled>{data.output}</textarea>
	<h3 style="text-align:center">Diff</h3>
	<div id="diff" class="dark-diff" />
{/if}

<style lang="scss">
	:global(.dark-diff) {
		:global(.d2h-code-side-linenumber),
		:global(.d2h-info),
		:global(.d2h-emptyplaceholder),
		:global(.d2h-code-side-emptyplaceholder),
		:global(.d2h-file-header),
		:global(.d2h-tag) {
			background-color: var(--bs-body-bg);
			color: var(--bs-body-color);
		}
		:global(span) {
			color: var(--bs-body-color);
		}

		:global(.d2h-file-wrapper) {
			border-color: var(--bs-border-color);
		}

		:global(.d2h-file-header) {
			border-bottom-color: var(--bs-border-color);
		}

		:global(.d2h-info) {
			border-color: var(--bs-border-color);
		}

		:global(.d2h-del) {
			background-color: var(--bs-danger-border-subtle);
			border-color: var(--bs-danger);
		}

		:global(del) {
			background-color: rgba(210, 85, 97, 0.5);
		}
		:global(.d2h-ins) {
			background-color: var(--bs-success-border-subtle);
			border-color: var(--bs-success);
		}

		:global(.d2h-code-side-emptyplaceholder),
		:global(.d2h-emptyplaceholder) {
			border-color: var(--bs-border-color);
		}

		:global(ins) {
			background-color: rgba(13, 125, 75, 0.5);
		}
	}
</style>
