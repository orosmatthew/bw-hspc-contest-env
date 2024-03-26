<script lang="ts">
	import type { Problem } from '@prisma/client';
	import { numInputCases, parseProblemInput } from '$lib/outputAnalyzer/inputAnalyzer';

	import { theme } from '../routes/stores';
	import { analyzeSubmissionOutput } from './outputAnalyzer/outputAnalyzer';
	import { CaseResult } from './outputAnalyzer/analyzerTypes';
	import { normalizeInputLines } from './outputAnalyzer/analyzerUtils';

	export let problem: Problem;
	export let output: string | null;

	const analysisResults = output != null ? analyzeSubmissionOutput(problem, output) : null;

	const inputLines = normalizeInputLines(problem.realInput);
	const inputCases = parseProblemInput(problem);

	const numCases = Number(numInputCases(problem.realInput));
	const numSampleCases = Number(numInputCases(problem.sampleInput));

	function caseResultToClassName(caseResult: CaseResult): string {
		switch (caseResult) {
			case CaseResult.Correct:
				return 'correct';
			case CaseResult.FormattingIssue:
				return 'formatError';
			case CaseResult.Exception:
			case CaseResult.RunnerFailure:
				return 'crash';
			case CaseResult.NoOutput:
				return 'noOutput';
			case CaseResult.Incorrect:
				return 'incorrect';
		}
	}

	function caseResultToDisplayText(caseResult: CaseResult): string {
		switch (caseResult) {
			case CaseResult.Correct:
				return 'Correct';
			case CaseResult.FormattingIssue:
				return 'Formatting';
			case CaseResult.Exception:
				return 'Crash';
			case CaseResult.NoOutput:
				return 'No Output';
			case CaseResult.RunnerFailure:
				return 'Run Fail';
			case CaseResult.Incorrect:
				return 'Incorrect';
		}
	}

	function inputLinesForCaseIndex(index: number): string[] {
		return inputLines.slice(
			inputCases.caseStartIndexes[index],
			index + 1 < inputCases.caseStartIndexes.length
				? inputCases.caseStartIndexes[index + 1]
				: inputLines.length
		);
	}
</script>

{#if !inputCases.success}
	<div class="mb-2">
		<span style="font-weight: bold">Failed to parse problem input: </span><span
			>{inputCases.errorMessage}</span
		>
	</div>
{/if}

<table class="outputdiff" data-bs-theme={$theme}>
	<thead>
		<tr>
			<td colspan="2">
				<b>{numCases} Test Cases</b>
			</td>
			<td class="sectionStart" colspan="2">
				<b>Team</b>
			</td>
			<td class="sectionStart">
				<b>Judge</b>
			</td>
		</tr>
		<tr>
			<td class="caseNumColumn">
				<b>Case #</b>
			</td>
			<td>
				<b>Data</b>
			</td>
			<td class="sectionStart">
				<b>Judgment</b>
			</td>
			<td>
				<b>Output</b>
			</td>
			<td class="sectionStart">
				<b>Output</b>
			</td>
		</tr>
	</thead>
	<tbody>
		{#if analysisResults}
			{#each analysisResults.testCaseResults as testCaseResult, i}
				<tr>
					<td class="caseNumColumn caseLabelCell {i < numSampleCases ? 'sample' : ''}">
						{#if i < numSampleCases}
							<span>(</span> <span class="inputCaseNumberLabel">#{testCaseResult.caseNum}</span>
							<span>)</span>
						{:else}
							<span class="inputCaseNumberLabel">#{testCaseResult.caseNum}</span>
						{/if}
					</td>
					<td class="inputTextCell">
						{#if inputCases.success}
							<pre>{inputLinesForCaseIndex(i).join('\n')}</pre>
						{/if}
					</td>
					<td
						class="outputTextCell sectionStart judgment {caseResultToClassName(
							testCaseResult.result
						)}">{caseResultToDisplayText(testCaseResult.result)}</td
					>
					<td class="outputTextCell {caseResultToClassName(testCaseResult.result)}">
						{#if testCaseResult.teamOutput}
							<pre class="outputstatus">{testCaseResult.teamOutput.join('\n')}</pre>
						{/if}
					</td>
					<td class="outputTextCell sectionStart judgeOutput">
						<pre class="outputstatus">{testCaseResult.judgeOutput.join('\n')}</pre>
					</td>
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

<style>
	:root {
		--correct: #eeffee;
		--correct-judgment: #abffab;
		--incorrect: #ffe9e9;
		--incorrect-judgment: #ffabab;
		--crash: #ffb1b1;
		--crash-judgment: #ff6464;
		--noOutput: #fffbef;
		--noOutput-judgment: #ffdfa5;
		--formatting: #ffffed;
		--formatting-judgment: #fbff47;

		--judge-background: #e3e3e3;
		--inputCaseNum-color: #888888;
	}

	[data-bs-theme='dark'] {
		--correct: #003c00;
		--correct-judgment: #006f00;
		--incorrect: #440000;
		--incorrect-judgment: #810000;
		--crash: #00007a;
		--crash-judgment: #0000b1;
		--noOutput: #241700;
		--noOutput-judgment: #4c3100;
		--formatting: #535b00;
		--formatting-judgment: #6d7100;

		--judge-background: #4e4e4e;
		--inputCaseNum-color: #acacac;
	}

	table.outputdiff {
		border: 2px solid;
	}

	table thead {
		border-bottom: 2px solid;
	}

	table td {
		padding-left: 20px;
		padding-right: 20px;
		border-left: 1px solid;
		border-right: 1px solid;
	}

	table thead td {
		border-bottom: 1px solid;
		padding-top: 3px;
		padding-bottom: 4px;
		text-align: center;
	}

	table tbody td {
		border-bottom: 1px solid #888888;
	}

	table td:first-child {
		border-left: none;
	}

	table td.sectionStart {
		border-left: 5px double;
	}

	table td:last-child {
		border-right: none;
	}

	td.caseLabelCell {
		width: 100px;
		vertical-align: top;
		text-align: center;
		color: var(--inputCaseNum-color);
	}

	td.caseLabelCell.sample {
		color: var(--inputCaseNum-color);
	}

	.inputCaseNumberLabel {
		font-style: italic;
	}

	td.inputTextCell {
		vertical-align: top;
		max-width: 400px;
		overflow-x: auto;
		font-weight: bold;
	}

	td.outputTextCell {
		vertical-align: top;
		max-width: 700px;
		overflow-x: auto;
	}

	.caseNumColumn {
		padding-left: 6px;
		padding-right: 6px;
	}

	pre {
		display: inline-block;
		margin-top: 3px;
		margin-bottom: -3px;
	}

	td.correct {
		background: var(--correct);
	}

	td.correct.judgment {
		background: var(--correct-judgment);
	}

	td.incorrect {
		background: var(--incorrect);
	}

	td.incorrect.judgment {
		background: var(--incorrect-judgment);
	}

	td.formatError {
		background: var(--formatting);
	}

	td.formatError.judgment {
		background: var(--formatting-judgment);
	}

	td.crash {
		background: var(--crash);
	}

	td.crash.judgment {
		background: var(--crash-judgment);
		font-weight: bold;
	}

	td.noOutput {
		background: var(--noOutput);
		font-style: italic;
		font-size: small;
	}

	td.noOutput.judgment {
		background: var(--noOutput-judgment);
	}

	td.judgeOutput {
		background: var(--judge-background);
	}
</style>
