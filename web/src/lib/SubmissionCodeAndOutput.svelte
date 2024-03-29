<script lang="ts">
	import type { Problem, SubmissionSourceFile } from '@prisma/client';
	import Tabs from './SubmissionTabs/Tabs.svelte';
	import Tab from './SubmissionTabs/TabEntry.svelte';
	import DiffView from './DiffView.svelte';
	import AnnotatedOutput from './AnnotatedOutput.svelte';
	import Code from './Code.svelte';

	export let problem: Problem;
	export let expectedOutput: string;
	export let output: string | null;
	export let diff: string | null;
	export let sourceFiles: SubmissionSourceFile[];
</script>

<div class="pb-4">
	<Tabs>
		<Tab tab="Inspector">
			<AnnotatedOutput {problem} {output} />
		</Tab>
		<Tab tab="Team Code">
			{#if sourceFiles.length == 0}
				<div>
					<span style="font-weight: bold">No Code Recorded</span>
				</div>
			{:else}
				<div>
					{#each sourceFiles as sourceFile}
						<div>
							<b class="font-monospace">{sourceFile.pathFromProblemRoot}</b>
							<Code code={sourceFile.content} highlight={true} />
						</div>
					{/each}
				</div>
			{/if}
		</Tab>

		<Tab tab="Line Diff">
			<p class="diffExplanation">
				Lines are compared by index, with no attempt to match similar lines or determine test case
				output boundaries
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="aligned" />
		</Tab>
		<Tab tab="Case Diff">
			<p class="diffExplanation">
				Uses heuristics to group outputs by case, producing a case-by-case diff.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="case-diff" />
		</Tab>
		<Tab tab="Old Diff">
			<p class="diffExplanation">
				Uses a diff tool to create a diff. May produce confusing diffs if it matches
				non-corresponding outputs.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="best-match" />
		</Tab>

		<Tab tab="Raw Output">
			<Code code={output ?? ''} highlight={false} />
		</Tab>
		<Tab tab="Raw Input">
			<Code code={problem.realInput} highlight={false} />
		</Tab>
	</Tabs>
</div>

<style>
	.diffExplanation {
		font-style: italic;
	}
</style>
