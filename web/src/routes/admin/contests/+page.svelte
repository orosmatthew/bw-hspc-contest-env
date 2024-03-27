<script lang="ts">
	import FormAlert from '$lib/FormAlert.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Contests</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi bi-flag"></i> Contests</h1>

<FormAlert />

<div class="d-flex flex-row justify-content-end">
	<a href="/admin/contests/create" class="btn btn-outline-success m-1">Create</a>
	<a href="/admin/contests/import" class="btn btn-outline-success m-1">Import</a>
</div>

<div class="mt-3 table-responsive">
	<table class="table table-bordered table-hover">
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Status</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.contests as contest}
				<tr>
					<td>{contest.id}</td>
					<td>{contest.name}</td>
					<td>
						{#if contest.activeTeams === 0}
							<span class="badge bg-secondary">Inactive</span>
						{:else}
							<span class="badge bg-success">Active</span>
						{/if}
					</td>
					<td
						><a
							href={`/admin/contests/${contest.id.toString()}`}
							class="btn btn-sm btn-outline-secondary">Details</a
						></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
