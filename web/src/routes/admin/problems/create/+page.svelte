<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { Actions } from './$types';

	interface Props {
		form: Actions;
	}

	let { form }: Props = $props();

	$effect(() => {
		if (form && form.success) {
			goto('/admin/problems');
		}
	});
</script>

<svelte:head>
	<title>Create Problem</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Create Problem</h1>

<div class="row">
	<div class="col-6">
		<a href="/admin/problems" class="btn btn-outline-primary">Back</a>
	</div>
</div>

{#if form && !form.success}
	<div class="mt-3 alert alert-danger">Invalid data</div>
{/if}

<form method="POST" action="?/create" use:enhance>
	<div class="row justify-content-center">
		<h4 style="text-align:center" class="mt-3">Name</h4>
		<div class="col-md-auto">
			<textarea name="name" class="form-control"></textarea>
		</div>
		<h4 style="text-align:center" class="mt-3">PascalCase Name (for filenames)</h4>
		<div class="col-md-auto">
			<input name="pascalName" class="form-control" />
		</div>
	</div>
	<h4 style="text-align:center" class="mt-5">Sample Data</h4>
	<div class="row">
		<div class="col-6">
			<h5>Input</h5>
			<textarea name="sampleInput" class="form-control"></textarea>
		</div>
		<div class="col-6">
			<h5>Output</h5>
			<textarea name="sampleOutput" class="form-control"></textarea>
		</div>
	</div>

	<h4 style="text-align:center" class="mt-5">Real Data</h4>
	<div class="row">
		<div class="col-6">
			<h5>Input</h5>
			<textarea name="realInput" class="form-control"></textarea>
		</div>
		<div class="col-6">
			<h5>Output</h5>
			<textarea name="realOutput" class="form-control"></textarea>
		</div>
	</div>
	<div class="mt-3 row">
		<div class="text-end">
			<button type="submit" class="btn btn-success">Create</button>
		</div>
	</div>
</form>
