export type AnalyzedOutputPreview = {
	testCaseResults: TestCaseResultPreview[];
	databaseString: string;
};

export type AnalyzedOutput = {
	testCaseResults: TestCaseResult[];
	databaseString: string;
};

export type TestCaseResultPreview = {
	caseNum: number;
	isSampleData: boolean;
	result: CaseResult;
};

export type TestCaseResult = TestCaseResultPreview & {
	judgeOutput: string[];
	teamOutput: string[] | null;
};

export enum CaseResult {
	Correct,
	FormattingIssue,
	LabellingIssue,
	Incorrect,
	Exception,
	NoOutput,
	RunnerFailure
}
