<script lang="ts">
	import type { Problem, SubmissionSourceFile } from '@prisma/client';
	import Tabs from './SubmissionTabs/Tabs.svelte';
	import Tab from './SubmissionTabs/TabEntry.svelte';
	import DiffView from './DiffView.svelte';
	import AnnotatedOutput from './AnnotatedOutput.svelte';
	import Code from './Code.svelte';

	interface Props {
		problem: Problem;
		expectedOutput: string;
		output: string | null;
		diff: string | null;
		sourceFiles: SubmissionSourceFile[];
	}

	let { problem, expectedOutput, output, diff, sourceFiles }: Props = $props();
</script>

<div class="pb-4">
	<Tabs>
		<Tab tab="Inspector">
			<div class="pt-2">
				<AnnotatedOutput {problem} {output} />
			</div>
		</Tab>
		<Tab tab="Team Code">
			{#if sourceFiles.length == 0}
				<div class="pt-2">
					<span style="font-weight: bold">No Code Recorded</span>
				</div>
			{:else}
				<div class="pt-2">
					{#each sourceFiles as sourceFile (sourceFile.id)}
						<div>
							<b class="font-monospace">{sourceFile.pathFromProblemRoot}</b>
							<Code code={sourceFile.content} highlight={true} />
						</div>
					{/each}
				</div>
			{/if}
		</Tab>

		<Tab tab="Line Diff">
			<p class="diffExplanation pt-2">
				Lines are compared by index, with no attempt to match similar lines or determine test case
				output boundaries
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="aligned" />
		</Tab>
		<Tab tab="Case Diff">
			<p class="diffExplanation pt-2">
				Uses heuristics to group outputs by case, producing a case-by-case diff.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="case-diff" />
		</Tab>
		<Tab tab="Basic Diff">
			<p class="diffExplanation pt-2">
				Uses a diff tool to create a diff. May produce confusing diffs if it matches
				non-corresponding outputs.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="best-match" />
		</Tab>

		<Tab tab="Raw Output">
			<div class="pt-2">
				<Code code={output ?? ''} highlight={false} />
			</div>
		</Tab>
		<Tab tab="Raw Input">
			<div class="pt-2">
				<Code code={problem.realInput} highlight={false} />
			</div>
		</Tab>
	</Tabs>
</div>

<style>
	.diffExplanation {
		font-style: italic;
	}
</style>
