<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="mb-4">Reviews</h1>

<a href="/logout" class="mb-2 btn btn-outline-primary">Logout</a>

<ul class="list-group">
	{#each data.reviewList as review}
		<a href="/admin/diff" class="list-group-item list-group-item-action">{review}</a>
	{/each}
</ul>
