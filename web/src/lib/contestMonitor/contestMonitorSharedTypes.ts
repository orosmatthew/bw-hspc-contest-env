export type FullStateForExtension = {
	contestState: ContestStateForExtension,
	submissions: SubmissionForExtension[]
}

export type ProblemNameForExtension = {
	id: number,
	friendlyName: string,
}

export type ContestStateForExtension = { 
	startTime: Date | null,
	endTime: Date | null,
    problems: ProblemNameForExtension[],
	isActive: boolean,
	isScoreboardFrozen: boolean,
}

export type SubmissionStateForExtension = 'Processing' | 'Correct' | 'Incorrect';

export type SubmissionForExtension = {
	id: number,
	contestId: number,
	teamId: number,
	problemId: number,
	createdAt: Date,
	state: SubmissionStateForExtension
	message: string | null
}