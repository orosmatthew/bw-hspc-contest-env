<script lang="ts">
	import type { Problem } from '@prisma/client';
	import { numInputCases, parseProblemInput } from '$lib/outputAnalyzer/inputAnalyzer';

	import { theme } from '../routes/stores';
	import { analyzeSubmissionOutput } from './outputAnalyzer/outputAnalyzer';
	import type { CaseResult } from './outputAnalyzer/analyzerTypes';
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
			case 'Correct':
				return 'correct';
			case 'FormattingIssue':
				return 'format-error';
			case 'LabellingIssue':
				return 'label-error';
			case 'Exception':
			case 'RunnerFailure':
				return 'crash';
			case 'NoOutput':
				return 'no-output';
			case 'Incorrect':
				return 'incorrect';
		}
	}

	function caseResultToDisplayText(caseResult: CaseResult): string {
		switch (caseResult) {
			case 'Correct':
				return 'Correct';
			case 'FormattingIssue':
				return 'Formatting';
			case 'LabellingIssue':
				return 'Label Error';
			case 'Exception':
				return 'Crash';
			case 'NoOutput':
				return 'No Output';
			case 'RunnerFailure':
				return 'Run Fail';
			case 'Incorrect':
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
		<b>Failed to parse problem input: </b><span>{inputCases.errorMessage}</span>
	</div>
{/if}

<div class="pt-2 table-resonsive table-bordered">
	<table class="table table-hover" data-bs-theme={$theme}>
		<thead>
			<tr>
				<td class="text-center" colspan="2">
					<b>{numCases} Test Cases</b>
				</td>
				<td class="text-center" colspan="2">
					<b>Team</b>
				</td>
				<td class="text-center">
					<b>Judge</b>
				</td>
			</tr>
			<tr>
				<td class="text-center">
					<b>Case #</b>
				</td>
				<td class="text-center">
					<b>Data</b>
				</td>
				<td class="text-center">
					<b>Judgment</b>
				</td>
				<td class="text-center">
					<b>Output</b>
				</td>
				<td class="text-center">
					<b>Output</b>
				</td>
			</tr>
		</thead>
		<tbody>
			{#if analysisResults}
				{#each analysisResults.testCaseResults as testCaseResult, i}
					<tr>
						<td class="text-secondary text-center">
							{#if i < numSampleCases}
								<span>sample</span><br /><i>#{testCaseResult.caseNum}</i>
							{:else}
								<i>#{testCaseResult.caseNum}</i>
							{/if}
						</td>
						<td style="max-width:300px">
							<b class="font-monospace">
								{#if inputCases.success}
									<pre>{inputLinesForCaseIndex(i).join('\n')}</pre>
								{/if}
							</b>
						</td>
						<td
							style="max-width:300px"
							class="judgment {caseResultToClassName(testCaseResult.result)}"
							>{caseResultToDisplayText(testCaseResult.result)}</td
						>
						<td style="max-width:300px" class={caseResultToClassName(testCaseResult.result)}>
							{#if testCaseResult.teamOutput}
								<pre class="outputstatus">{testCaseResult.teamOutput.join('\n')}</pre>
							{/if}
						</td>
						<td style="max-width:300px" class="judge-output">
							<pre class="outputstatus">{testCaseResult.judgeOutput.join('\n')}</pre>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style lang="scss">
	:root {
		--correct: #eeffee;
		--correct-judgment: #abffab;
		--incorrect: #ffe9e9;
		--incorrect-judgment: #ffabab;
		--crash: #ffb1b1;
		--crash-judgment: #ff6464;
		--no-output: #fffbef;
		--no-output-judgment: #ffdfa5;
		--formatting: #ffffed;
		--formatting-judgment: #fbff47;
		--labelling: #ffecad;
		--labelling-judgment: #ffdd24;

		--judge-background: #e3e3e3;
	}

	[data-bs-theme='dark'] {
		--correct: #003c00;
		--correct-judgment: #006f00;
		--incorrect: #440000;
		--incorrect-judgment: #810000;
		--crash: #00007a;
		--crash-judgment: #0000b1;
		--no-output: #241700;
		--no-output-judgment: #4c3100;
		--formatting: #535b00;
		--formatting-judgment: #6d7100;
		--labelling: #473c00;
		--labelling-judgment: #716000;

		--judge-background: #4e4e4e;
	}

	td {
		&.correct {
			background: var(--correct);

			&.judgment {
				background: var(--correct-judgment);
			}
		}

		&.incorrect {
			background: var(--incorrect);

			&.judgment {
				background: var(--incorrect-judgment);
			}
		}

		&.format-error {
			background: var(--formatting);

			&.judgment {
				background: var(--formatting-judgment);
			}
		}

		&.label-error {
			background: var(--labelling);

			&.judgment {
				background: var(--labelling-judgment);
			}
		}

		&.crash {
			background: var(--crash);

			&.judgment {
				background: var(--crash-judgment);
				font-weight: bold;
			}
		}

		&.no-output.judgment {
			background: var(--no-output-judgment);
		}

		&.judge-output {
			background: var(--judge-background);
		}
	}
</style>
