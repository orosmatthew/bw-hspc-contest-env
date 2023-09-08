<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Problems</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-question-circle"></i> Problems</h1>

<div class="row mb-3">
	<div class="text-end">
		<a href="/admin/problems/create" class="btn btn-outline-success">Create</a>
	</div>
</div>

{#if data.problems.length === 0}
	<div class="alert alert-warning">No problems</div>
{/if}

<div class="table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.problems as problem}
				<tr>
					<td>{problem.id}</td>
					<td>{problem.friendlyName}</td>
					<td
						><a
							href={`/admin/problems/${problem.id.toString()}`}
							class="btn btn-sm btn-outline-secondary">Details</a
						></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
