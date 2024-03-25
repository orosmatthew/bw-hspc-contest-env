import type { Problem } from '@prisma/client';

export function parseProblemInput(
	problem: Problem
):
	| { success: true; caseStartIndexes: number[] }
	| { success: false; caseStartIndexes: number[]; errorMessage: string } {
	if (problem.inputSpec) {
		return parseInputCases(problem.realInput, problem.inputSpec);
	}

	return {
		success: false,
		caseStartIndexes: [],
		errorMessage: 'Problem has no input specification.'
	};
}

function parseInputCases(
	inputText: string,
	spec: string
):
	| { success: true; caseStartIndexes: number[] }
	| { success: false; caseStartIndexes: number[]; errorMessage: string } {
	const result: number[] = [];
	const splitSpec = spec.split(';');
	const inputLines = inputText
		.replace('\r\n', '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line);

	let lineIndex = 1;

	try {
		while (lineIndex < inputLines.length) {
			result.push(lineIndex);

			for (const specPart of splitSpec) {
				if (specPart.startsWith('C')) {
					const linesToConsume = Number(specPart.slice(1));
					lineIndex += linesToConsume;
				} else if (specPart.startsWith('T')) {
					const tokenIndex = Number(specPart.slice(1));
					const linesToConsume = Number(inputLines[lineIndex].split(' ')[tokenIndex]);
					lineIndex += 1 + linesToConsume;
				}
			}
		}
	} catch (error) {
		return {
			success: false,
			caseStartIndexes: result,
			errorMessage: 'Error thrown while parsing:' + (error?.toString() ?? '')
		};
	}

	const numCases = Number(inputLines[0]);
	const correctCaseCount = result.length == numCases;
	const correctLinesConsumed = lineIndex == inputLines.length;

	if (correctCaseCount && correctLinesConsumed) {
		return { success: true, caseStartIndexes: result };
	}

	let errorMessage = '';

	if (!correctLinesConsumed) {
		errorMessage += `Line count mismatch. Judge output has ${inputLines.length} lines but parsing jumped to lineIndex ${lineIndex}. `;
	}

	if (!correctCaseCount) {
		errorMessage += `Incorrect case count. First input line says ${numCases} cases but we parsed ${result.length}}. `;
	}

	return { success: false, caseStartIndexes: result, errorMessage };
}
