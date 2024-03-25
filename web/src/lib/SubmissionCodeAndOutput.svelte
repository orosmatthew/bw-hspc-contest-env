<script lang="ts">
	import type { Problem, SubmissionSourceFile } from '@prisma/client';
	import Tabs from './TabBar/TabBar.svelte';
	import Tab from './TabBar/TabEntry.svelte';
	import DiffView from './DiffView.svelte';
	import AnnotatedOutput from './AnnotatedOutput.svelte';

	export let problem: Problem;
	export let expectedOutput: string;
	export let output: string | null;
	export let diff: string | null;
	export let sourceFiles: SubmissionSourceFile[];

	let rawOutputRows = output?.split('\n').length ?? 1;
	let rawOutputCols =
		output
			?.split('\n')
			.map((line) => line.length)
			.reduce((p, c) => Math.max(p, c), 0) ?? 1;

	let rawInputRows = problem.realInput.split('\n').length;
	let rawInputCols = problem.realInput
		.split('\n')
		.map((line) => line.length)
		.reduce((p, c) => Math.max(p, c), 0);

	let linesOfCode = sourceFiles.map((f) => f.content.split('\n').length).reduce((p, c) => p + c, 0);
</script>

<div class="mb-4" style="width: fit-content">
	<Tabs>
		<Tab index={0} title="Inspector">
			<AnnotatedOutput {problem} {output} />
		</Tab>
		<Tab index={1} title={linesOfCode > 0 ? `Team Code (${linesOfCode} lines)` : `No Team Code`}>
			{#if sourceFiles.length == 0}
				<div>
					<span style="font-weight: bold">No Code Recorded</span>
				</div>
			{:else}
				<div>
					{#each sourceFiles as sourceFile}
						{@const codeRows = Math.min(20, sourceFile.content.split('\n').length)}
						{@const codeCols = sourceFile.content
							.split('\n')
							.map((line) => line.length)
							.reduce((p, c) => Math.max(p, c), 0)}
						<div>
							<span style="font-weight: bold; font-family: monospace"
								>{sourceFile.pathFromProblemRoot}</span
							>
							<textarea
								rows={codeRows}
								cols={codeCols}
								class="code mb-3 form-control"
								style="margin-left: 20px; margin-top: 10px"
								disabled>{sourceFile.content}</textarea
							>
						</div>
					{/each}
				</div>
			{/if}
		</Tab>

		<Tab index={2}></Tab>

		<Tab index={3} title="Line Diff">
			<p class="diffExplanation">
				Lines are compared by index, with no attempt to match similar lines or determine test case
				output boundaries
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="aligned" />
		</Tab>
		<Tab index={4} title="Case Diff">
			<p class="diffExplanation">
				Uses heuristics to group outputs by case, producing a case-by-case diff.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="case-diff" />
		</Tab>
		<Tab index={5} title="Old Diff">
			<p class="diffExplanation">
				Uses a diff tool to create a diff. May produce confusing diffs if it matches
				non-corresponding outputs.
			</p>
			<DiffView {expectedOutput} {output} {diff} {problem} kind="best-match" />
		</Tab>

		<Tab index={6}></Tab>

		<Tab index={7} title="Raw Output">
			<textarea class="code form-control" rows={rawOutputRows} cols={rawOutputCols} disabled
				>{output}</textarea
			>
		</Tab>
		<Tab index={8} title="Raw Input">
			<textarea class="code form-control" rows={rawInputRows} cols={rawInputCols} disabled
				>{problem.realInput}</textarea
			>
		</Tab>
	</Tabs>
</div>

<style>
	.diffExplanation {
		font-style: italic;
	}
</style>
