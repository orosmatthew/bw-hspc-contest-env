<script lang="ts">
	import { type Problem, type Submission } from '@prisma/client';
	import {
		CaseResult,
		type TestCaseResult,
		type TestCaseResultPreview
	} from './outputAnalyzer/analyzerTypes';
	import { theme } from '../routes/stores';
	import {
		analyzeSubmissionOutput,
		rehydrateOutputPreview
	} from './outputAnalyzer/outputAnalyzer';

	export let problem: Problem;
	export let submission: Submission;
	export let condensed: boolean = false;
	export let previousSubmission: Submission | null = null;

	let cellsPerRow = condensed ? 20 : 30;

	let previousSubmitResults:
		| { condensed: true; testCases: TestCaseResultPreview[] }
		| { condensed: false; testCases: TestCaseResult[] }
		| null = null;

	let currentSubmitResults:
		| { condensed: true; testCases: TestCaseResultPreview[] }
		| { condensed: false; testCases: TestCaseResult[] }
		| null = { condensed, testCases: [] };

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
						testCases: analyzeSubmissionOutput(problem, previousSubmission.actualOutput)
							.testCaseResults
					}
				: null;

		currentSubmitResults =
			submission.actualOutput != null
				? {
						condensed,
						testCases: analyzeSubmissionOutput(problem, submission.actualOutput).testCaseResults
					}
				: null;
	}

	function resultKindClassName(caseResult: CaseResult): string {
		switch (caseResult) {
			case CaseResult.Correct:
				return 'correct';
			case CaseResult.NoOutput:
				return 'nooutput';
			case CaseResult.Exception:
				return 'exception';
			case CaseResult.RunnerFailure:
				return 'buildfailure';
			case CaseResult.Incorrect:
				return 'incorrect';
			case CaseResult.FormattingIssue:
				return 'correctignoringcaselabelling';
		}
	}

	function getResultText(caseResult: CaseResult): string {
		switch (caseResult) {
			case CaseResult.Correct:
				return 'Correct';
			case CaseResult.NoOutput:
				return 'No Output';
			case CaseResult.Exception:
				return 'Exception';
			case CaseResult.RunnerFailure:
				return 'Build Failure';
			case CaseResult.Incorrect:
				return 'Incorrect';
			case CaseResult.FormattingIssue:
				return 'Formatting Error';
			default:
				return '???';
		}
	}
</script>

<table class="resultstable" data-bs-theme={$theme}>
	<tbody>
		{#if currentSubmitResults}
			{@const numCases = currentSubmitResults.testCases.length}
			{@const numRows = Math.ceil(currentSubmitResults.testCases.length / cellsPerRow)}
			{@const showRowLabels = !condensed && numRows > 1}
			{#each { length: numRows } as _, rowNum}
				{@const casesBeforeThisRow = rowNum * cellsPerRow}
				{@const casesOnRow = Math.min(cellsPerRow, numCases - casesBeforeThisRow)}
				<tr>
					{#if showRowLabels}
						<td style="font-family: monospace;">
							{casesBeforeThisRow + 1}-{casesBeforeThisRow + casesOnRow}:
						</td>
					{/if}
					{#each { length: Math.min(cellsPerRow, currentSubmitResults.testCases.length - rowNum * cellsPerRow) } as _, colNum}
						{@const currentCaseIndex = rowNum * cellsPerRow + colNum}
						{@const currentCaseResult = currentSubmitResults.testCases[currentCaseIndex]}
						<td class="testcaseresult {resultKindClassName(currentCaseResult.result)}
							{currentCaseResult.isSampleData ? 'sampleinput' : ''}"
						>
							<div
								class="testcaseresult {resultKindClassName(currentCaseResult.result)}
							{currentCaseResult.isSampleData ? 'sampleinput' : ''}
							{previousSubmitResults &&
								previousSubmitResults.testCases[currentCaseIndex].result != currentCaseResult.result
									? 'changedFromPreviousSubmit'
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
		--correctIgnoringFormatting-color: #e1ed26;
		--incorrect-color: #f4bcbc;
		--noOutput-color: #cacaca;

		--testcase-border-color: #555555;
		--testcase-border-color-hover: #000000;
		--changed-border-color: #6e6ecf;
	}

	[data-bs-theme='dark'] {
		--correct-color: #2c951b;
		--correctIgnoringFormatting-color: #c8d500;
		--incorrect-color: #be0000;
		--noOutput-color: #424242;

		--testcase-border-color: #e0e0e0;
		--testcase-border-color-hover: #ffffff;
		--changed-border-color: #ecffd2;
	}

	table.resultstable {
		border-collapse: separate;
		border-spacing: 3px;
	}

	div.testcaseresult:hover {
		transform: scale(1.15);
	}

	td.submissionresult {
		width: 104px;
		min-width: 104px;
	}

	td.testcaseresult {
		width: 16px;
		height: 16px;
		max-height: 16px;
		max-width: 16px;
	}

	td.sampleinput {
		width: 11px;
		height: 11px;
	}

	div.testcaseresult {
		border: 1px solid var(--testcase-border-color);
		height: 16px;
		width: 16px;
	}

	div .testcaseresult .changedFromPreviousSubmit {
		border: 2px solid var(--changed-border-color);
	}

	div.correct {
		background-color: var(--correct-color);
	}

	div.nooutput {
		background-color: var(--noOutput-color);
	}

	div.exception {
		background: linear-gradient(
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

	div.buildfailure {
		background-color: #5555aa;
	}

	div.incorrect {
		background-color: var(--incorrect-color);
	}

	div.correctignoringcaselabelling {
		background-color: var(--correctIgnoringFormatting-color);
	}

	div.sampleinput {
		height: 10px;
		width: 10px;
		padding: 0;
		margin-left: auto;
		margin-right: auto;
	}
</style>
