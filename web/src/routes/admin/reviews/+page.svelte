<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
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
