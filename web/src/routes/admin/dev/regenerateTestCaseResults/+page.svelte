<script lang="ts">
	import { enhance } from '$app/forms';
	import FormAlert from '$lib/FormAlert.svelte';
	import type { Actions, PageData } from './$types';

	let log = $state('');

	interface Props {
		form: Actions;
		data: PageData;
	}

	let { form, data }: Props = $props();

	const submissionsWithOutput = data.submissions.filter((s) => s.actualOutput != null);
	const submissionsWithOutputButNoTestCaseResults = submissionsWithOutput.filter(
		(s) => s.testCaseResults == null
	);
	$effect(() => {
		if (form) {
			if (form.success) {
				log += 'Success.\n';
				log += 'Count: ' + form.count + '\n';
				log += 'Problems: ' + form.problemCount + '\n';
				log += 'Report: \n';
				log += JSON.parse(form.reportJson?.toString() ?? '[]').join('\n') + '\n\n';
			} else {
				log += 'Error.\n';
				log += 'Message: ' + form.errorMessage + '\n';
				log += 'Problems: ' + form.problemCount + '\n';
				log += 'Report: \n';
				log += form.report + '\n\n';
			}
		}
	});
</script>

<svelte:head>
	<title>Regenerate Test Case Results</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi"></i>Regenerate Test Case Results</h1>

<FormAlert />

<ul>
	<li># total submissions: {data.submissions.length}</li>
	<li># submissions with output: {submissionsWithOutput.length}</li>
	<li>
		# submissions with output but no cached testCaseResults: {submissionsWithOutputButNoTestCaseResults.length}
	</li>
</ul>

<form action="?/regenerateMissing" method="POST" use:enhance class="mb-2">
	<button type="submit"
		>Generate Missing ({submissionsWithOutputButNoTestCaseResults.length})</button
	>
</form>

<form action="?/regenerateAll" method="POST" use:enhance class="mb-2">
	<button type="submit">Regenerate All With Output ({submissionsWithOutput.length})</button>
</form>

<h4 class="mt-4">Log</h4>
<textarea rows="16" cols="100">{log}</textarea>
