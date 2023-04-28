<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="mb-4">Reviews</h1>

<ul class="list-group">
	{#each data.reviewList as review}
		<a href="/admin/diff" class="list-group-item list-group-item-action">{review}</a>
	{/each}
</ul>
