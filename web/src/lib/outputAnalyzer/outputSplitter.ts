import type { CaseResult } from './analyzerTypes';

export const caseLabelRegex = /^case\s*[\d]*\s*:?\s*/i;

const errorIndicators: { text: string; forcedResult: CaseResult }[] = [
	{ text: 'Error: Invalid or corrupt jarfile', forcedResult: 'RunnerFailure' },
	{ text: 'Exception in thread', forcedResult: 'Exception' }
];

export function splitJudgeOutput(
	outputLines: string[],
	totalCaseCount: number
): ({ lines: string[]; forcedResult: CaseResult | null } | null)[] {
	return splitOutputWithCaseLabels(outputLines, totalCaseCount);
}

export function splitTeamOutput(
	teamOutputLines: string[],
	judgeOutputLines: string[],
	totalCaseCount: number
): ({ lines: string[]; forcedResult: CaseResult | null } | null)[] {
	if (teamOutputLines.some((line) => caseLabelRegex.test(line))) {
		return splitOutputWithCaseLabels(teamOutputLines, totalCaseCount);
	} else {
		return splitOutputWithoutCaseLabels(teamOutputLines, judgeOutputLines, totalCaseCount);
	}
}

function splitOutputWithCaseLabels(
	outputLines: string[],
	totalCaseCount: number
): ({ lines: string[]; forcedResult: CaseResult | null } | null)[] {
	const errorIndicator = findErrorIndicator(outputLines);

	let interruptionLines: string[] = [];
	if (errorIndicator != null) {
		interruptionLines = outputLines.slice(errorIndicator.lineIndex);
		outputLines = outputLines.slice(0, errorIndicator.lineIndex);
	}

	const outputCases: ({ lines: string[]; forcedResult: CaseResult | null } | null)[] = [];
	const outputCaseLineRanges = caseLabelLineRanges(outputLines);

	for (let i = 0; i < totalCaseCount; i++) {
		if (i < outputCaseLineRanges.length) {
			const startIndex = outputCaseLineRanges[i].startIndex;
			const endIndexExclusive =
				i == totalCaseCount - 1
					? Math.max(outputCaseLineRanges[i].endIndexExclusive, outputLines.length)
					: outputCaseLineRanges[i].endIndexExclusive;

			outputCases.push({
				lines: outputLines.slice(startIndex, endIndexExclusive),
				forcedResult: null
			});
		} else {
			// Less case labels than expected
			outputCases.push(null);
		}
	}

	if (outputCaseLineRanges.length > totalCaseCount) {
		// More case labels than expected
		const extraLines = outputLines.slice(outputCaseLineRanges[totalCaseCount].startIndex);
		outputCases[totalCaseCount - 1]!.lines.push(...extraLines);
	}

	if (interruptionLines.length > 0) {
		const lastIndexWithRecordedOutput = outputCases.findLastIndex((c) => c != null);
		if (lastIndexWithRecordedOutput + 1 < outputCases.length) {
			outputCases[lastIndexWithRecordedOutput + 1] = {
				lines: interruptionLines,
				forcedResult: errorIndicator!.forcedResult
			};
		} else {
			outputCases[outputCases.length - 1]!.lines.push(...interruptionLines);
			outputCases[outputCases.length - 1]!.forcedResult = errorIndicator!.forcedResult;
		}
	}

	return outputCases;
}

function findErrorIndicator(
	lines: string[]
): { lineIndex: number; forcedResult: CaseResult } | null {
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		for (const errorIndicator of errorIndicators) {
			if (lines[lineIndex].includes(errorIndicator.text)) {
				return { lineIndex, forcedResult: errorIndicator.forcedResult };
			}
		}
	}

	return null;
}

function splitOutputWithoutCaseLabels(
	teamOutputLines: string[],
	judgeOutputLines: string[],
	totalCaseCount: number
): ({ lines: string[]; forcedResult: CaseResult | null } | null)[] {
	const errorIndicator = findErrorIndicator(teamOutputLines);
	let interruptionLines: string[] = [];
	if (errorIndicator != null) {
		interruptionLines = teamOutputLines.slice(errorIndicator.lineIndex);
		teamOutputLines = teamOutputLines.slice(0, errorIndicator.lineIndex);
	}

	let teamOutputCases: ({ lines: string[]; forcedResult: CaseResult | null } | null)[];

	if (teamOutputLines.length < totalCaseCount) {
		// With insufficient output and no case labels, we assume one line per case.
		const missingLineCount = totalCaseCount - teamOutputLines.length;
		teamOutputCases = teamOutputLines
			.map<{
				lines: string[];
				forcedResult: CaseResult | null;
			} | null>((line) => ({ lines: [line], forcedResult: null }))
			.concat(...Array(missingLineCount).map(() => null));
	} else if (teamOutputLines.length == totalCaseCount) {
		// Regardless of whether the judge expects multiple lines per case, we assume here
		// that the team is outputting one case per line.
		teamOutputCases = teamOutputLines.map<{
			lines: string[];
			forcedResult: CaseResult | null;
		} | null>((line) => ({ lines: [line], forcedResult: null }));
	} else {
		// More than one team output line per case. Regardless of judge output lines per case,
		// break team outputs along judge output boundaries

		teamOutputCases = [];

		const judgeCaseOutputRanges = caseLabelLineRanges(judgeOutputLines);
		for (let i = 0; i < totalCaseCount; i++) {
			const startIndex = judgeCaseOutputRanges[i].startIndex;
			const endIndexExclusive =
				i == totalCaseCount - 1
					? Math.max(judgeCaseOutputRanges[i].endIndexExclusive, teamOutputLines.length)
					: judgeCaseOutputRanges[i].endIndexExclusive;

			const teamLinesForCase = teamOutputLines.slice(startIndex, endIndexExclusive);
			teamOutputCases.push(
				teamLinesForCase.length > 0 ? { lines: teamLinesForCase, forcedResult: null } : null
			);
		}
	}

	if (interruptionLines.length > 0) {
		const lastIndexWithRecordedOutput = teamOutputCases.findLastIndex((c) => c != null);
		if (lastIndexWithRecordedOutput + 1 < teamOutputCases.length) {
			teamOutputCases[lastIndexWithRecordedOutput + 1] = {
				lines: interruptionLines,
				forcedResult: errorIndicator!.forcedResult
			};
		} else {
			teamOutputCases[teamOutputCases.length - 1]!.lines.push(...interruptionLines);
			teamOutputCases[teamOutputCases.length - 1]!.forcedResult = errorIndicator!.forcedResult;
		}
	}

	return teamOutputCases;
}

function caseLabelLineRanges(
	outputLines: string[]
): { startIndex: number; endIndexExclusive: number }[] {
	const lineIndicesWithCaseLabels: number[] = [];
	for (let i = 0; i < outputLines.length; i++) {
		if (caseLabelRegex.test(outputLines[i])) {
			lineIndicesWithCaseLabels.push(i);
		}
	}

	return lineIndicesWithCaseLabels.map((lineIndex, i) => {
		const startIndex = i == 0 ? 0 : lineIndex;
		return {
			startIndex,
			endIndexExclusive: lineIndicesWithCaseLabels[i + 1] ?? outputLines.length
		};
	});
}
