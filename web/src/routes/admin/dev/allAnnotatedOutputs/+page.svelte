<script lang="ts">
	import AnnotatedOutput from '$lib/AnnotatedOutput.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>All Annotated Outputs</title>
</svelte:head>

<h1 style="text-align:center" class="mb-1"><i class="bi"></i>All Annotated Outputs</h1>

{#each data.submissions as submission}
	<h2>{submission.team.name} : {submission.problem.friendlyName}</h2>
	<div>
		<AnnotatedOutput problem={submission.problem} output={submission.actualOutput} />
	</div>
{/each}
