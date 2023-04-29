<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Problems</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Problems</h1>

<div class="row mb-3">
	<div class="text-end">
		<a href="/admin/problems/create" class="btn btn-outline-success">Create</a>
	</div>
</div>

{#if data.problems.length === 0}
	<div class="alert alert-warning">No problems</div>
{/if}
<div class="list-group">
	{#each data.problems as problem}
		<a
			href={'/admin/problems/' + problem.id.toString()}
			class="list-group-item list-group-item-action">{problem.friendlyName}</a
		>
	{/each}
</div>
