<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';

	export let data: PageData;

	onMount(() => {
		if (data.diff) {
			const diff2htmlUi = new Diff2HtmlUI(document.getElementById('diff')!, data.diff, {
				drawFileList: false,
				matching: 'lines',
				diffStyle: 'char',
				outputFormat: 'side-by-side',
				highlight: false,
				fileContentToggle: false
			});
			diff2htmlUi.draw();
		}
	});
</script>

<svelte:head>
	<title>Submission</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Submission</h1>

<a href="/admin/submissions" class="mb-3 btn btn-outline-primary">All Submissions</a>

<table class="table table-bordered table-hover">
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
	<h2 style="text-align:center">Diff</h2>
	<div id="diff" />
{/if}
