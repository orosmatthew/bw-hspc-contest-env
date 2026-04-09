<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import FormAlert from '$lib/components/FormAlert.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	$effect(() => {
		if (form && form.success) {
			void goto(resolve('/admin/contests'));
		}
	});

	let selectedTeamIds = new SvelteSet<number>();
	let selectedProblemIds = new SvelteSet<number>();

	function selectTeamsAll() {
		for (const team of data.teams) {
			selectedTeamIds.add(team.id);
		}
	}

	function selectTeamsNone() {
		selectedTeamIds.clear();
	}

	function selectProblemsAll() {
		for (const problem of data.problems) {
			selectedProblemIds.add(problem.id);
		}
	}

	function selectProblemsNone() {
		selectedProblemIds.clear();
	}
</script>

<svelte:head>
	<title>Create Contest</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-flag"></i> Create Contest</h1>

<FormAlert />

<form method="POST" action="?/create" use:enhance>
	<h4>Name</h4>
	<input name="name" class="form-control" required />

	<input type="hidden" name="teamIds" value={JSON.stringify(Array.from(selectedTeamIds))} />
	<input type="hidden" name="problemIds" value={JSON.stringify(Array.from(selectedProblemIds))} />

	<div class="mt-3 row">
		<div class="col-6">
			<h4>Teams</h4>
			<div class="row mb-2">
				<div>
					<button onclick={selectTeamsAll} type="button" class="btn btn-outline-secondary btn-sm"
						>Select All</button
					>
					<button onclick={selectTeamsNone} type="button" class="btn btn-outline-secondary btn-sm"
						>Select None</button
					>
				</div>
			</div>
			{#each data.teams as team (team.id)}
				<div class="form-check">
					<input
						class="team-checkbox form-check-input"
						type="checkbox"
						checked={selectedTeamIds.has(team.id)}
						id={'team-' + team.id}
						oninput={(e) => {
							if (e.currentTarget.checked) {
								selectedTeamIds.add(team.id);
							} else {
								selectedTeamIds.delete(team.id);
							}
						}}
					/>
					<label class="form-check-label" for={'team-' + team.id}>{team.name}</label>
				</div>
			{/each}
		</div>
		<div class="col-6">
			<h4>Problems</h4>
			<div class="row mb-2">
				<div>
					<button onclick={selectProblemsAll} type="button" class="btn btn-outline-secondary btn-sm"
						>Select All</button
					>
					<button
						onclick={selectProblemsNone}
						type="button"
						class="btn btn-outline-secondary btn-sm">Select None</button
					>
				</div>
			</div>
			{#each data.problems as problem (problem.id)}
				<div class="form-check">
					<input
						class="problem-checkbox form-check-input"
						type="checkbox"
						checked={selectedProblemIds.has(problem.id)}
						id={'problem-' + problem.id}
						oninput={(e) => {
							if (e.currentTarget.checked) {
								selectedProblemIds.add(problem.id);
							} else {
								selectedProblemIds.delete(problem.id);
							}
						}}
					/>
					<label class="form-check-label" for={'problem-' + problem.id}
						>{problem.friendlyName}</label
					>
				</div>
			{/each}
		</div>
	</div>
	<div class="d-flex flex-row justify-content-end gap-2">
		<a href={resolve('/admin/contests')} class="btn btn-outline-secondary">Cancel</a>
		<button type="submit" class="btn btn-success">Create</button>
	</div>
</form>
