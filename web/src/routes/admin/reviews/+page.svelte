<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
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
		<div class="col-6">
			<h5>Expected output (real data)</h5>
			<textarea name="expected" class="form-control" />
		</div>
		<div class="col-6">
			<h5>Actual output (like from student output)</h5>
			<textarea name="actual" class="form-control" />
		</div>
	</div>
	<div class="row justify-content-end">
		<div class="text-end">
			<button type="submit" class="mt-3 btn btn-secondary">Submit</button>
		</div>
	</div>
</form>
