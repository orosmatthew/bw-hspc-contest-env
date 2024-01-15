<script lang="ts">
	import type { Actions, PageData } from './$types';
	import { onMount } from 'svelte';
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { enhance } from '$app/forms';
	import { stretchTextarea } from '$lib/util';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import { theme } from '../../../stores';

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
	<title>Submission - {data.teamName} - {data.problemName}</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<h1 style="text-align:center" class="mb-4">
	<i class="bi bi-envelope-paper"></i> Submission - {data.teamName} - {data.problemName}
</h1>

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

<div class="table-responsive">
	<table class="table table-bordered">
		<thead>
			<tr>
				<th>Team</th>
				<th>Problem</th>
				<th>Status</th>
				<th>Submit Time</th>
				<th>Graded Time</th>
				<th>Message</th>
			</tr>
		</thead>
		<tbody>
			<tr>
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
				<td>
					{#if data.state === 'Queued'}
						<span class="badge bg-secondary">Queued</span>
					{:else if data.state === 'InReview'}
						<span class="badge bg-warning">In Review</span>
					{:else if data.state === 'Correct'}
						<span class="badge bg-success">Correct</span>
					{:else if data.state === 'Incorrect'}
						<span class="badge bg-danger">Incorrect</span>
					{/if}

					{#if data.stateReason === 'BuildError'}
						<span class="badge bg-danger opacity-50">Build Error</span>
					{:else if data.stateReason === 'TimeLimitExceeded'}
						<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
					{:else if data.stateReason === 'IncorrectOverriddenAsCorrect'}
						<span class="badge bg-success opacity-50">Manually Graded</span>
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
</div>

{#if data.state == 'InReview'}
	<div class="row">
		<div class="text-center">
			<a href={'/admin/diff/' + data.id} class="btn btn-warning">Review Submission</a>
		</div>
	</div>
{:else if data.state == 'Incorrect' && data.stateReason == 'BuildError'}
	<h3 style="text-align:center">Build Output</h3>
	<textarea use:stretchTextarea class="code mb-3 form-control" disabled
		>{data.stateReasonDetails}</textarea
	>
{:else if data.state == 'Incorrect' && data.stateReason == 'TimeLimitExceeded'}
	<h3 style="text-align:center">Details</h3>
	<textarea use:stretchTextarea class="code mb-3 form-control" disabled
		>{data.stateReasonDetails}</textarea
	>
{:else}
	<h3 style="text-align:center">Output</h3>
	<textarea use:stretchTextarea class="code mb-3 form-control" disabled>{data.output}</textarea>
	<h3 style="text-align:center">Diff</h3>
	<div
		id="diff"
		class="dark-diff"
		class:d2h-dark-color-scheme={$theme === 'dark'}
		class:d2h-light-color-scheme={$theme === 'light'}
	/>
{/if}
