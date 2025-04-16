<script lang="ts">
	import type { Problem, Submission } from '@prisma/client';
	import type {
		CaseResult,
		TestCaseResult,
		TestCaseResultPreview
	} from './outputAnalyzer/analyzerTypes';
	import { theme } from '../routes/stores';
	import { analyzeSubmissionOutput, rehydrateOutputPreview } from './outputAnalyzer/outputAnalyzer';

	interface Props {
		problem: Problem;
		submission: Submission;
		condensed?: boolean;
		previousSubmission?: Submission | null;
	}

	let { problem, submission, condensed = false, previousSubmission = null }: Props = $props();

	let cellsPerRow = condensed ? 20 : 30;

	let previousSubmitResults:
		| { condensed: true; testCases: TestCaseResultPreview[] }
		| { condensed: false; testCases: TestCaseResult[] }
		| null = $state(null);

	let currentSubmitResults:
		| { condensed: true; testCases: TestCaseResultPreview[] }
		| { condensed: false; testCases: TestCaseResult[] }
		| null = $state({ condensed, testCases: [] });

	if (condensed) {
		previousSubmitResults = previousSubmission?.testCaseResults
			? {
					condensed,
					testCases: rehydrateOutputPreview(previousSubmission.testCaseResults).testCaseResults
				}
			: null;

		currentSubmitResults = submission.testCaseResults
			? {
					condensed,
					testCases: rehydrateOutputPreview(submission.testCaseResults).testCaseResults
				}
			: null;
	} else {
		previousSubmitResults =
			previousSubmission?.actualOutput != null
				? {
						condensed,
						testCases:
							analyzeSubmissionOutput(problem, previousSubmission.actualOutput)?.testCaseResults ??
							[]
					}
				: null;

		currentSubmitResults =
			submission.actualOutput != null
				? {
						condensed,
						testCases:
							analyzeSubmissionOutput(problem, submission.actualOutput)?.testCaseResults ?? []
					}
				: null;
	}

	function resultKindClassName(caseResult: CaseResult): string {
		switch (caseResult) {
			case 'Correct':
				return 'correct';
			case 'NoOutput':
				return 'no-output';
			case 'Exception':
				return 'exception';
			case 'RunnerFailure':
				return 'build-failure';
			case 'Incorrect':
				return 'incorrect';
			case 'FormattingIssue':
				return 'formatting-issue';
			case 'LabellingIssue':
				return 'labelling-issue';
		}
	}
</script>

<table class="result-stable" data-bs-theme={$theme}>
	<tbody>
		{#if currentSubmitResults}
			{@const numCases = currentSubmitResults.testCases.length}
			{@const numRows = Math.ceil(currentSubmitResults.testCases.length / cellsPerRow)}
			{@const showRowLabels = !condensed && numRows > 1}
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each { length: numRows } as _, rowNum (rowNum)}
				{@const casesBeforeThisRow = rowNum * cellsPerRow}
				{@const casesOnRow = Math.min(cellsPerRow, numCases - casesBeforeThisRow)}
				<tr>
					{#if showRowLabels}
						<td style="font-family: monospace;">
							{casesBeforeThisRow + 1}-{casesBeforeThisRow + casesOnRow}:
						</td>
					{/if}
					<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
					{#each { length: Math.min(cellsPerRow, currentSubmitResults.testCases.length - rowNum * cellsPerRow) } as _, colNum (colNum)}
						{@const currentCaseIndex = rowNum * cellsPerRow + colNum}
						{@const currentCaseResult = currentSubmitResults.testCases[currentCaseIndex]}
						<td
							class="test-case-result {resultKindClassName(currentCaseResult.result)}
							{currentCaseResult.isSampleData ? 'sample-input' : ''}"
						>
							<div
								class="test-case-result {resultKindClassName(currentCaseResult.result)}
							{currentCaseResult.isSampleData ? 'sample-input' : ''}
							{previousSubmitResults &&
								previousSubmitResults.testCases[currentCaseIndex].result != currentCaseResult.result
									? 'changed-from-previous-submit'
									: ''}"
							>
								<span class="textcaseresultsymbol"></span>
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

<style>
	:root {
		--correct-color: #9eff8e;
		--formatting-issue-color: #e1ed26;
		--labelling-issue-color: #ffdd24;
		--incorrect-color: #f4bcbc;
		--no-output-color: #cacaca;

		--test-case-border-color: #555555;
		--test-case-border-color-hover: #000000;
		--changed-border-color: #6e6ecf;
	}

	[data-bs-theme='dark'] {
		--correct-color: #2c951b;
		--formatting-issue-color: #c8d500;
		--labelling-issue-color: #d5a800;
		--incorrect-color: #be0000;
		--no-output-color: #424242;

		--test-case-border-color: #e0e0e0;
		--test-case-border-color-hover: #ffffff;
		--changed-border-color: #ecffd2;
	}

	table.result-stable {
		border-collapse: separate;
		border-spacing: 3px;
	}

	div.test-case-result:hover {
		transform: scale(1.15);
	}

	td.submission-result {
		width: 104px;
		min-width: 104px;
	}

	td.test-case-result {
		width: 16px;
		height: 16px;
		max-height: 16px;
		max-width: 16px;
	}

	td.sample-input {
		width: 11px;
		height: 11px;
	}

	div.test-case-result {
		border: 1px solid var(--test-case-border-color);
		height: 16px;
		width: 16px;
	}

	:global(div .test-case-result .changed-from-previous-submit) {
		border: 2px solid var(--changed-border-color);
	}

	div.correct {
		background-color: var(--correct-color);
	}

	div.no-output {
		background-color: var(--no-output-color);
	}

	div.exception {
		background:
			linear-gradient(
				to top right,
				rgba(255, 0, 0, 0.15) calc(50% - 1.4px),
				red,
				rgba(255, 0, 0, 0.15) calc(50% + 1.4px)
			),
			linear-gradient(
				to left top,
				rgba(0, 0, 0, 0) calc(50% - 1.4px),
				red,
				rgba(0, 0, 0, 0) calc(50% + 1.4px)
			);
		border-color: #ff0000;
		height: 18px;
	}

	div.build-failure {
		background-color: #5555aa;
	}

	div.incorrect {
		background-color: var(--incorrect-color);
	}

	div.formatting-issue {
		background-color: var(--formatting-issue-color);
	}

	div.labelling-issue {
		background-color: var(--labelling-issue-color);
	}

	div.sample-input {
		height: 10px;
		width: 10px;
		padding: 0;
		margin-left: auto;
		margin-right: auto;
	}
</style>
