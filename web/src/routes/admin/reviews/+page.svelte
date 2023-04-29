<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let selectedTeam: (typeof data.teams)[0] | null;
	let selectedProblem: (typeof data.problems)[0] | null;
</script>

<svelte:head>
	<title>Reviews</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Reviews</h1>

<ul class="list-group">
	{#if data.reviewList.length === 0}
		<div class="alert alert-success">No Submission to Review!</div>
	{/if}
	{#each data.reviewList as review}
		<a href={'/admin/diff/' + review.id.toString()} class="list-group-item list-group-item-action"
			>{review.createdAt.toLocaleDateString() + ' ' + review.createdAt.toLocaleTimeString()}</a
		>
	{/each}
</ul>

<hr />
<h2>For Testing Purposes - Create Fake Submission</h2>
{#if form && !form.success}
	<div class="alert alert-danger">Invalid Submission</div>
{/if}
<form method="POST" action="?/submission" use:enhance>
	<div class="row">
		<div class="col-3">
			<h5>Team</h5>
			<div class="dropdown">
				<button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
					{selectedTeam ? selectedTeam.name : 'Select Team'}
				</button>
				<ul class="dropdown-menu">
					{#each data.teams as team}
						<li>
							<button
								on:click={() => {
									selectedTeam = team;
								}}
								type="button"
								class="dropdown-item">{team.name}</button
							>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<div class="col-3">
			<h5>Problem</h5>
			<div class="dropdown">
				<button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
					{selectedProblem ? selectedProblem.name : 'Select Problem'}
				</button>
				<ul class="dropdown-menu">
					{#each data.problems as problem}
						<li>
							<button
								on:click={() => {
									selectedProblem = problem;
								}}
								type="button"
								class="dropdown-item">{problem.name}</button
							>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<div class="col-6">
			<h5>Actual output (like from student output)</h5>
			<textarea name="actual" class="form-control" />
		</div>
	</div>
	<input name="teamId" type="hidden" value={selectedTeam ? selectedTeam.id : ''} />
	<input name="problemId" type="hidden" value={selectedProblem ? selectedProblem.id : ''} />
	<div class="row justify-content-end">
		<div class="text-end">
			<button type="submit" class="mt-3 btn btn-secondary">Submit</button>
		</div>
	</div>
</form>
