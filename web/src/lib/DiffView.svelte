<script lang="ts">
	import 'diff2html/bundles/css/diff2html.min.css';

	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import { onMount } from 'svelte';
	import * as Diff from 'diff';
	import { theme } from '../routes/stores';
	import { analyzeSubmissionOutput } from './outputAnalyzer/outputAnalyzer';
	import type { Problem } from '@prisma/client';
	import { newline, trimmedLines } from './outputAnalyzer/analyzerUtils';

	export let expectedOutput: string;
	export let output: string | null;
	export let diff: string | null;
	export let kind: 'aligned' | 'best-match' | 'case-diff';
	export let problem: Problem;

	let localDiff: string | null = null;

	function drawBestMatchDiff() {
		localDiff = diff;
		if (!localDiff && output) {
			localDiff = Diff.createPatch(
				'Judge → Team',
				trimmedLines(expectedOutput).join(newline),
				trimmedLines(output ?? '').join(newline)
			);
		}

		if (localDiff) {
			const diff2htmlUi = new Diff2HtmlUI(document.getElementById(`diff_${kind}`)!, localDiff, {
				drawFileList: false,
				matching: 'words',
				diffStyle: 'word',
				outputFormat: 'side-by-side',
				highlight: false,
				fileContentToggle: true,
				renderNothingWhenEmpty: false
			});
			diff2htmlUi.draw();
		}
	}

	function drawAlignedDiff() {
		const cleanJudgeOutputLines = trimmedLines(expectedOutput);
		const cleanTeamOutputLines = trimmedLines(output ?? '');

		localDiff = 'Index: Judge → Team\n';
		localDiff += '===================================================================\n';
		localDiff += '--- Judge → Team\n';
		localDiff += '+++ Judge → Team\n';
		localDiff += '@@ -1 +1 @@\n';

		for (let i = 0; i < Math.max(cleanJudgeOutputLines.length, cleanTeamOutputLines.length); i++) {
			const judgeLine = cleanJudgeOutputLines[i] ?? null;
			const teamLine = cleanTeamOutputLines[i] ?? null;
			if (teamLine == null) {
				localDiff += `-${judgeLine}\n`;
			} else if (judgeLine == null) {
				localDiff += `+${teamLine}\n`;
			} else if (judgeLine == teamLine) {
				localDiff += ` ${teamLine}\n`;
			} else {
				localDiff += `-${judgeLine}\n`;
				localDiff += `+${teamLine}\n`;
			}
		}

		if (localDiff) {
			const diff2htmlUi = new Diff2HtmlUI(document.getElementById(`diff_${kind}`)!, localDiff, {
				drawFileList: false,
				matching: 'none',
				diffStyle: 'word',
				outputFormat: 'side-by-side',
				highlight: false,
				fileContentToggle: true,
				renderNothingWhenEmpty: false
			});
			diff2htmlUi.draw();
		}
	}

	function drawCaseDiff() {
		localDiff = 'Index: Judge → Team\n';
		localDiff += '===================================================================\n';
		localDiff += '--- Judge → Team\n';
		localDiff += '+++ Judge → Team\n';

		const analyzedOutput = analyzeSubmissionOutput(problem, output ?? '');
		let judgeLinesPrinted = 0;
		let teamLinesPrinted = 0;

		for (let caseIndex = 0; caseIndex < analyzedOutput.testCaseResults.length; caseIndex++) {
			const judgeCaseLines = analyzedOutput.testCaseResults[caseIndex].judgeOutput;
			const teamCaseLines = analyzedOutput.testCaseResults[caseIndex].teamOutput ?? [];

			localDiff += `@@ -${judgeLinesPrinted + 1} +${teamLinesPrinted + 1} @@ Case ${caseIndex + 1}\n`;
			judgeLinesPrinted += judgeCaseLines.length;
			teamLinesPrinted += teamCaseLines?.length ?? 0;

			for (
				let caseLineIndex = 0;
				caseLineIndex < Math.max(judgeCaseLines.length, teamCaseLines.length);
				caseLineIndex++
			) {
				if (caseLineIndex < judgeCaseLines.length && caseLineIndex < teamCaseLines.length) {
					if (judgeCaseLines[caseLineIndex] == teamCaseLines[caseLineIndex]) {
						localDiff += ` ${judgeCaseLines[caseLineIndex]}\n`;
						continue;
					}
				}

				if (caseLineIndex < judgeCaseLines.length) {
					localDiff += `-${judgeCaseLines[caseLineIndex]}\n`;
				}

				if (caseLineIndex < teamCaseLines.length) {
					localDiff += `+${teamCaseLines[caseLineIndex]}\n`;
				}
			}
		}

		if (localDiff) {
			const diff2htmlUi = new Diff2HtmlUI(document.getElementById(`diff_${kind}`)!, localDiff, {
				drawFileList: false,
				matching: 'none',
				diffStyle: 'word',
				outputFormat: 'side-by-side',
				highlight: false,
				fileContentToggle: true,
				renderNothingWhenEmpty: false
			});
			diff2htmlUi.draw();
		}
	}

	onMount(() => {
		switch (kind) {
			case 'aligned':
				drawAlignedDiff();
				break;
			case 'best-match':
				drawBestMatchDiff();
				break;
			case 'case-diff':
				drawCaseDiff();
				break;
		}
	});
</script>

<div
	class="mt-3 diffView"
	id={`diff_${kind}`}
	class:d2h-dark-color-scheme={$theme === 'dark'}
	class:d2h-light-color-scheme={$theme === 'light'}
/>

<style>
	.diffView {
		min-width: 800px;
		max-width: 1200px;
	}
</style>
