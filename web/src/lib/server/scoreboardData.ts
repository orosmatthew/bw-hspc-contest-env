import type { SubmissionState } from '@prisma/client';

type ScoreboardContestDataType = {
	id: number;
	startTime: Date | null;
	freezeTime: Date | null;
	name: string;
	problems: {
		id: number;
		friendlyName: string;
	}[];
	teams: {
		id: number;
		name: string;
		submissions: {
			id: number;
			contestId: number;
			createdAt: Date;
			state: SubmissionState;
			problemId: number;
			gradedAt: Date | null;
		}[];
	}[];
};

type ScoreboardDataType = {
	timestamp: Date;
	frozen: boolean;
	contest: {
		id: number;
		name: string;
		problems: { id: number; friendlyName: string }[];
		teams: {
			id: number;
			name: string;
			solves: number;
			time: number;
			problems: {
				id: number;
				attempts: number;
				graphic: 'correct' | 'incorrect' | null;
				min: number | undefined;
			}[];
		}[];
	};
};

function getTeamCorrectSubmissions(
	contestId: number,
	team: ScoreboardContestDataType['teams'][number]
): ScoreboardContestDataType['teams'][number]['submissions'] {
	const correctSubmissions = team.submissions.filter(
		(submission) => submission.contestId === contestId && submission.state === 'Correct'
	);
	const dedupedSubmissions: Array<
		ScoreboardContestDataType['teams'][number]['submissions'][number]
	> = [];
	for (const submission of correctSubmissions) {
		const existingIndex = dedupedSubmissions.findIndex((s) => s.problemId === submission.problemId);
		if (existingIndex !== -1) {
			if (submission.createdAt < dedupedSubmissions[existingIndex].createdAt) {
				dedupedSubmissions[existingIndex] = submission;
			}
			continue;
		}
		dedupedSubmissions.push(submission);
	}
	return dedupedSubmissions;
}

function getTeamTime(params: {
	contestId: number;
	contestStartTime: Date;
	team: ScoreboardContestDataType['teams'][number];
}): number {
	const correctSubmissions = getTeamCorrectSubmissions(params.contestId, params.team);
	const incorrectSubmissionsBeforeCorrect = params.team.submissions.filter(
		(submission) =>
			submission.contestId === params.contestId &&
			submission.state === 'Incorrect' &&
			correctSubmissions.find(
				(correct) =>
					correct.problemId === submission.problemId && submission.createdAt < correct.createdAt
			) !== undefined
	);
	const penaltyTime = incorrectSubmissionsBeforeCorrect.length * 10;
	let time = penaltyTime;
	for (const correct of correctSubmissions) {
		time += (correct.createdAt.valueOf() - params.contestStartTime.valueOf()) / 60000;
	}
	return time;
}

function getTeamProblemAttempts(params: {
	contestId: number;
	teamSubmissions: ScoreboardContestDataType['teams'][number]['submissions'];
	problem: ScoreboardContestDataType['problems'][number];
}): ScoreboardContestDataType['teams'][number]['submissions'] {
	const correct = params.teamSubmissions
		.toSorted((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
		.find(
			(s) =>
				s.contestId === params.contestId &&
				s.problemId === params.problem.id &&
				s.state === 'Correct'
		);
	const problemSubmissions = params.teamSubmissions.filter(
		(s) => s.contestId === params.contestId && s.problemId === params.problem.id
	);
	return correct !== undefined
		? problemSubmissions.filter((s) => s.createdAt <= correct.createdAt)
		: problemSubmissions;
}

function getTeamProblemGraphic(params: {
	contestId: number;
	problemId: number;
	teamSubmissions: ScoreboardContestDataType['teams'][number]['submissions'];
}): ScoreboardDataType['contest']['teams'][number]['problems'][number]['graphic'] {
	const problemSubmissions = params.teamSubmissions.filter(
		(s) => s.contestId === params.contestId && s.problemId === params.problemId
	);
	if (problemSubmissions.find((s) => s.state === 'Correct')) {
		return 'correct';
	} else if (problemSubmissions.find((s) => s.state === 'Incorrect')) {
		return 'incorrect';
	}
	return null;
}

function getTeamProblemMin(params: {
	contestId: number;
	contestStartTime: Date;
	problemId: number;
	teamSubmissions: ScoreboardContestDataType['teams'][number]['submissions'];
}): ScoreboardDataType['contest']['teams'][number]['problems'][number]['min'] {
	const correctSubmission = params.teamSubmissions
		.toSorted((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
		.find(
			(s) =>
				s.contestId === params.contestId &&
				s.problemId === params.problemId &&
				s.state === 'Correct'
		);
	if (correctSubmission !== undefined) {
		return (correctSubmission.createdAt.valueOf() - params.contestStartTime.valueOf()) / 60000;
	}
	return undefined;
}

function getTeamProblems(params: {
	contestId: number;
	contestStartTime: Date;
	contestProblems: ScoreboardContestDataType['problems'];
	teamSubmissions: ScoreboardContestDataType['teams'][number]['submissions'];
}): ScoreboardDataType['contest']['teams'][number]['problems'] {
	return params.contestProblems.map((problem) => ({
		id: problem.id,
		attempts: getTeamProblemAttempts({
			contestId: params.contestId,
			problem,
			teamSubmissions: params.teamSubmissions
		}).length,
		graphic: getTeamProblemGraphic({
			contestId: params.contestId,
			problemId: problem.id,
			teamSubmissions: params.teamSubmissions
		}),
		min: getTeamProblemMin({
			contestId: params.contestId,
			contestStartTime: params.contestStartTime,
			problemId: problem.id,
			teamSubmissions: params.teamSubmissions
		})
	}));
}

function getTeamsData(contest: ScoreboardContestDataType): ScoreboardDataType['contest']['teams'] {
	const contestStartTime = contest.startTime;
	if (contestStartTime === null) {
		throw new Error('Contest start time is null.');
	}
	return contest.teams
		.map((team) => ({
			id: team.id,
			name: team.name,
			solves: getTeamCorrectSubmissions(contest.id, team).length,
			time: getTeamTime({ contestId: contest.id, contestStartTime, team }),
			problems: getTeamProblems({
				contestId: contest.id,
				contestProblems: contest.problems,
				contestStartTime,
				teamSubmissions: team.submissions
			})
		}))
		.sort((a, b) => {
			if (a.solves > b.solves) {
				return -1;
			} else if (a.solves < b.solves) {
				return 1;
			} else {
				if (a.time < b.time) {
					return -1;
				} else if (a.time > b.time) {
					return 1;
				} else {
					return 0;
				}
			}
		});
}

export function scoreboardData(contest: ScoreboardContestDataType): ScoreboardDataType {
	return {
		timestamp: new Date(),
		frozen: contest.freezeTime !== null ? contest.freezeTime < new Date() : false,
		contest: {
			id: contest.id,
			name: contest.name,
			problems: contest.problems.map((problem) => {
				return { id: problem.id, friendlyName: problem.friendlyName };
			}),
			teams: getTeamsData(contest)
		}
	};
}
