<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Contests</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Contests</h1>

<div class="row">
	<div class="text-end">
		<a href="/admin/contests/create" class="btn btn-outline-success">Create</a>
	</div>
</div>

<div class="mt-3 list-group">
	{#each data.contests as contest}
		<a
			href={'/admin/contests/' + contest.id.toString()}
			class={`list-group-item list-group-item-action ${
				contest.activeTeams === 0 ? '' : ' list-group-item-success'
			}`}>{contest.name}</a
		>
	{/each}
</div>
