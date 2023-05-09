<script lang="ts">
	import type { Actions, PageData } from './$types';
	import { onMount } from 'svelte';
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { enhance } from '$app/forms';
	import { stretchTextarea } from '$lib/util';

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
</script>

<svelte:head>
	<title>Submission</title>
</svelte:head>

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
			use:enhance={({ cancel }) => {
				if (!confirm('Are you sure?')) {
					cancel();
				}
				return async ({ update }) => {
					update();
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
	<div id="diff" />
{/if}
