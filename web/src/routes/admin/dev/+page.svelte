<script lang="ts">
	import { enhance } from '$app/forms';
	import FormAlert from '$lib/FormAlert.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Dev Tools</title>
</svelte:head>

<FormAlert />

<h1 style="text-align:center" class="mb-1"><i class="bi"></i>Dev Tools</h1>

<p>
	<a href="/admin/dev/allAnnotatedOutputs">Show All Annotated Outputs (slow / memory intensive)</a>
</p>

<p>
	<a href="/admin/dev/regenerateTestCaseResults">Regenerate selected Test Case Results...</a>
</p>

<form action="?/fixProblemNewlines" method="POST" use:enhance class="mb-2">
	<button type="submit"
		>Fix Problem Newlines ({data.problems.filter((p) => {
			return (
				p.sampleInput.includes('\r') ||
				p.sampleOutput.includes('\r') ||
				p.realInput.includes('\r') ||
				p.realOutput.includes('\r')
			);
		}).length})
	</button>
</form>
