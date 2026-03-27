<script lang="ts">
	import AnnotatedOutput from '$lib/components/AnnotatedOutput.svelte';
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

{#each data.submissions as submission (submission.id)}
	{@const problem = data.problems.find((p) => p.id === submission.problemId)}
	{#if problem !== undefined}
		<h2>{submission.teamName} : {problem.friendlyName}</h2>
		<div>
			<AnnotatedOutput {problem} output={submission.actualOutput} />
		</div>
	{/if}
{/each}
