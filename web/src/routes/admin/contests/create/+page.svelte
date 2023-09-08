<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import FormAlert from '$lib/FormAlert.svelte';
	import type { Actions, PageData } from './$types';

	export let data: PageData;
	export let form: Actions;

	$: if (form && form.success) {
		goto('/admin/contests');
	}

	function selectTeamsAll() {
		document.querySelectorAll<HTMLInputElement>('.team-checkbox').forEach((elem) => {
			elem.checked = true;
		});
	}

	function selectTeamsNone() {
		document.querySelectorAll<HTMLInputElement>('.team-checkbox').forEach((elem) => {
			elem.checked = false;
		});
	}

	function selectProblemsAll() {
		document.querySelectorAll<HTMLInputElement>('.problem-checkbox').forEach((elem) => {
			elem.checked = true;
		});
	}

	function selectProblemsNone() {
		document.querySelectorAll<HTMLInputElement>('.problem-checkbox').forEach((elem) => {
			elem.checked = false;
		});
	}
</script>

<svelte:head>
	<title>Create Contest</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-flag"></i> Create Contest</h1>

<FormAlert />

<form method="POST" action="?/create" use:enhance>
	<h4>Name</h4>
	<input name="name" class="form-control" />

	<div class="mt-3 row">
		<div class="col-6">
			<h4>Teams</h4>
			<div class="row mb-2">
				<div>
					<button on:click={selectTeamsAll} type="button" class="btn btn-outline-secondary btn-sm"
						>Select All</button
					>
					<button on:click={selectTeamsNone} type="button" class="btn btn-outline-secondary btn-sm"
						>Select None</button
					>
				</div>
			</div>
			{#each data.teams as team}
				<div class="form-check">
					<input
						class="team-checkbox form-check-input"
						type="checkbox"
						value={team.id}
						id={'team_' + team.id}
						name={'team_' + team.id}
					/>
					<label class="form-check-label" for={'team_' + team.id}>{team.name}</label>
				</div>
			{/each}
		</div>
		<div class="col-6">
			<h4>Problems</h4>
			<div class="row mb-2">
				<div>
					<button
						on:click={selectProblemsAll}
						type="button"
						class="btn btn-outline-secondary btn-sm">Select All</button
					>
					<button
						on:click={selectProblemsNone}
						type="button"
						class="btn btn-outline-secondary btn-sm">Select None</button
					>
				</div>
			</div>
			{#each data.problems as problem}
				<div class="form-check">
					<input
						class="problem-checkbox form-check-input"
						type="checkbox"
						value={problem.id}
						id={'problem_' + problem.id}
						name={'problem_' + problem.id}
					/>
					<label class="form-check-label" for={'problem_' + problem.id}>{problem.name}</label>
				</div>
			{/each}
		</div>
	</div>
	<div class="d-flex flex-row justify-content-end gap-2">
		<a href="/admin/contests" class="btn btn-outline-secondary">Cancel</a>
		<button type="submit" class="btn btn-success">Create</button>
	</div>
</form>
