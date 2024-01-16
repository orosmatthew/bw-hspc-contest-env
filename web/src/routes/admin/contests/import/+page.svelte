<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import FormAlert from '$lib/FormAlert.svelte';
	import type { Actions } from './$types';
	import type { ContestImportData } from './+page.server';

	export let form: Actions;

	$: if (form && form.success) {
		goto('/admin/contests');
	}

	let jsonText = '';
	let parsesCorrectly: boolean | null = null;

	let numProblems: number | null = null;
	let numTeams: number | null = null;
	let numSubmissions: number | null = null;

	$: jsonText, updateUIFromJson();

	function updateUIFromJson() {
		try {
			JSON.parse(jsonText);
			const parsedContest: ContestImportData = JSON.parse(jsonText);
			numProblems = parsedContest.Problems?.length ?? null;
			numTeams = parsedContest.Teams?.length ?? null;
			numSubmissions = parsedContest.Submissions?.length ?? null;
			parsesCorrectly = numProblems > 0 && numTeams > 0 && parsedContest.Name?.length > 0;
		} catch {
			numProblems = null;
			numTeams = null;
			numSubmissions = null;
			parsesCorrectly = false;
		}

		if (jsonText.length == 0) {
			parsesCorrectly = null;
		}
	}
</script>

<svelte:head>
	<title>Import Contest</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-flag"></i> Import Contest</h1>

<FormAlert />

<form method="POST" use:enhance>
	<div class="mb-4">
		<h3>Contest JSON:</h3>
		<textarea
			id="jsonTextArea"
			name="jsonText"
			class="form-control"
			rows="10"
			bind:value={jsonText}
			style={parsesCorrectly == null
				? ''
				: `border: 2px solid ${parsesCorrectly ? 'green' : 'red'}`}
		/>
	</div>

	<div class="mb-4">
		<h3>Import Info:</h3>
		<span>{numTeams ?? 'No'} Teams</span><br />
		<span>{numProblems ?? 'No'} Problems</span><br />
		<span>{numSubmissions ?? 'No'} Submissions</span>
		(<input type="checkbox" checked name="includeSubmissions" id="includeSubmissions" />
		<label id="includeSubmissionsLabel" for="includeSubmissions">Include</label>)
	</div>

	<div class="d-flex flex-row justify-content-end gap-2 m-2">
		<a href="/admin/contests" class="btn btn-outline-secondary">Cancel</a>
		<button class="btn btn-success">Import</button>
	</div>
</form>
