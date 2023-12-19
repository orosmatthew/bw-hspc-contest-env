<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';

	export let data: PageData;

	$: data.submissions.sort((a, b) => {
		return b.createdAt.valueOf() - a.createdAt.valueOf();
	});

	let updateInterval: ReturnType<typeof setInterval> | undefined;
	let updating = false;

	onMount(() => {
		updateInterval = setInterval(async () => {
			updating = true;
			await invalidateAll();
			updating = false;
		}, 10000);
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
</script>

<svelte:head>
	<title>Submissions</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-envelope-paper"></i> Submissions</h1>

<div class="d-flex flex-row justify-content-end gap-2 align-items-center">
	{#if updating}
		<div class="spinner-border spinner-border-sm text-secondary" />
	{/if}
	<strong>Last Updated: </strong>{data.timestamp.toLocaleTimeString()}
</div>

<div class="mt-3 table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Team</th>
				<th>Problem</th>
				<th>State</th>
				<th>Submit Time</th>
				<th>Graded Time</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.submissions as submission}
				<tr>
					<td>
						{#if submission.teamName}
							{submission.teamName}
						{/if}
					</td>
					<td>
						{#if submission.problemName}
							{submission.problemName}
						{/if}
					</td>
					<td>
						{#if submission.state === 'Queued'}
							<span class="badge bg-secondary">Queued</span>
						{:else if submission.state === 'InReview'}
							<span class="badge bg-warning">In Review</span>
						{:else if submission.state === 'Correct'}
							<span class="badge bg-success">Correct</span>
						{:else if submission.state === 'Incorrect'}
							<span class="badge bg-danger">Incorrect</span>
						{/if}

						{#if submission.stateReason === 'BuildError'}
							<span class="badge bg-danger opacity-50">Build Error</span>
						{:else if submission.stateReason === 'TimeLimitExceeded'}
							<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
						{:else if submission.stateReason === 'IncorrectOverriddenAsCorrect'}
							<span class="badge bg-success opacity-50">Manually Graded</span>
						{/if}
					</td>
					<td
						>{submission.createdAt.toLocaleDateString() +
							' ' +
							submission.createdAt.toLocaleTimeString()}</td
					>
					<td>
						{#if submission.gradedAt}
							{submission.gradedAt.toLocaleDateString() +
								' ' +
								submission.gradedAt.toLocaleTimeString()}
						{/if}
					</td>
					<td>
						<a
							href={`/admin/submissions/${submission.id.toString()}`}
							class="btn btn-sm btn-outline-secondary">Details</a
						>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
