import type { Problem } from "@prisma/client";
import { getCleanLines } from "./analyzerUtils";
import { CaseResult, type AnalyzedOutput, type TestCaseResult, type TestCaseResultPreview, type AnalyzedOutputPreview } from "./analyzerTypes";
import { caseLabelRegex, splitJudgeOutput, splitTeamOutput } from "./outputSplitter";

// Team output analysis & test case results are used in two contexts:
//   1) High Fidelity:
//     - Includes the team output text for each test case, along with its corresponding problem input & judge output
//     - Only one High Fidelity analysis is displayed at any time
//     - To save DB space, these are recalculated from the team output text as needed
//   2) Preview:
//     - Shows a series of icons representing each test case result, not requiring the parsed input/output text
//     - Many Preview analysis results may be shown at the same time, e.g. on the Submissions page
//     - To save time, these are precomputed and stored in the database for each Submission as a compact string
//       with each test case represented by a single character representing its result kind (letter) and whether
//       the case was in the sample input (capitalization)

const caseResultToCompactChar = new Map<CaseResult, string>([
    [CaseResult.Correct, "C"],
    [CaseResult.FormattingIssue, "F"],
    [CaseResult.Incorrect, "I"],
    [CaseResult.NoOutput, "N"],
    [CaseResult.Exception, "E"],
    [CaseResult.RunnerFailure, "X"]
]);

const compactCharToCaseResult = new Map<string, CaseResult>(
    [...caseResultToCompactChar.entries()].map(([caseResult, char]) => [char, caseResult]));

export function analyzeSubmissionOutput(problem: Problem, teamOutput: string): AnalyzedOutput {
    const sampleCaseCount = parseInt(problem.sampleInput.split('\n')[0]);
    const totalCaseCount = parseInt(problem.realInput.split('\n')[0]);

    const teamOutputLines = getCleanLines(teamOutput);
    const judgeOutputLines = getCleanLines(problem.realOutput);

    const testCaseResults: TestCaseResult[] = [];

    const judgeCaseOutputs = splitJudgeOutput(judgeOutputLines, totalCaseCount);
    const teamCaseOutputs = splitTeamOutput(teamOutputLines, judgeOutputLines, totalCaseCount);

    for (let i = 0; i < totalCaseCount; i++) {
        const caseNum = i + 1;
        const isSampleData = caseNum <= sampleCaseCount;

        const judgeCaseOutputLines = judgeCaseOutputs[i]!.lines;
        const teamCaseOutputLines = teamCaseOutputs[i]?.lines ?? null;

        const caseCompareResult = teamCaseOutputs[i]?.forcedResult
            ?? compareSingleCaseOutput(judgeCaseOutputLines, teamCaseOutputLines);

        testCaseResults.push({ 
            caseNum,
            isSampleData,
            result: caseCompareResult,
            judgeOutput: judgeCaseOutputLines,
            teamOutput: teamCaseOutputLines
        });
    }

    const databaseString = testCaseResults.map(r => getDatabaseRepresentation(r)).join("");

    return {
        testCaseResults,
        databaseString
    };

    function getDatabaseRepresentation(testCaseResult: TestCaseResult): string {
        const char = caseResultToCompactChar.get(testCaseResult.result)!;
        return testCaseResult.isSampleData ? char.toLowerCase() : char;
    }
}

export function rehydrateOutputPreview(databaseString: string): AnalyzedOutputPreview {    
    const testCaseResultPreviews = databaseString.split('').map<TestCaseResultPreview>((char, i) => {
        const result = compactCharToCaseResult.get(char.toUpperCase())!;
        const caseNum = i + 1;
        const isSampleData = ("a" <= char && char <= 'z');
        return { caseNum, isSampleData, result };
    });

    return {
        testCaseResults: testCaseResultPreviews,
        databaseString
    };
}

function compareSingleCaseOutput(judgeCaseOutputLines: string[], teamCaseOutputLines: string[] | null): CaseResult {
    if (teamCaseOutputLines == null) {
        return CaseResult.NoOutput;
    }

    if (judgeCaseOutputLines.length == teamCaseOutputLines.length) {
        let allMatch = true;
        for (let i = 0; i < judgeCaseOutputLines.length; i++) {
            if (judgeCaseOutputLines[i] != teamCaseOutputLines[i]) {
                allMatch = false;
                break;
            }
        }

        if (allMatch) {
            return CaseResult.Correct;
        }
    }

    const reassembledJudgeOutput = judgeCaseOutputLines.join("\n");
    const reassembledTeamOutput = teamCaseOutputLines.join("\n");

    if (reassembledJudgeOutput == reassembledTeamOutput) {
        return CaseResult.FormattingIssue;
    }

    const judgeOutputAsSingleLineWithNormalizedSpace = judgeCaseOutputLines.join(' ').replace(/\s+/g, ' ');
    const teamOutputAsSingleLineWithNormalizedSpace = teamCaseOutputLines.join(' ').replace(/\s+/g, ' ');

    if (judgeOutputAsSingleLineWithNormalizedSpace == teamOutputAsSingleLineWithNormalizedSpace) {
        return CaseResult.FormattingIssue;
    }

    const judgeOutputCaseStr = reassembledJudgeOutput.match(caseLabelRegex)?.[0] ?? "";
    const reassembledJudgeOutputWithoutLabel = reassembledJudgeOutput.substring(judgeOutputCaseStr.length).trim();

    const teamOutputCaseStr = reassembledTeamOutput.match(caseLabelRegex)?.[0] ?? "";
    const reassembledTeamOutputWithoutLabel = reassembledTeamOutput.substring(teamOutputCaseStr.length).trim();

    if (reassembledJudgeOutputWithoutLabel == reassembledTeamOutputWithoutLabel) {
        return CaseResult.FormattingIssue;
    }

    return CaseResult.Incorrect;
}
