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
		name: string;
		submissions: {
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
		name: string;
		problems: { id: number; friendlyName: string }[];
		teams: {
			name: string;
			solves: number;
			time: number;
			problems: { id: number; attempts: number; graphic: string | null; min: number | undefined }[];
		}[];
	};
};

export function scoreboardData(contest: ScoreboardContestDataType): ScoreboardDataType {
	return {
		timestamp: new Date(),
		frozen: contest.freezeTime !== null ? contest.freezeTime < new Date() : false,
		contest: {
			name: contest.name,
			problems: contest.problems.map((problem) => {
				return { id: problem.id, friendlyName: problem.friendlyName };
			}),
			teams: contest.teams
				.map((team) => {
					return {
						name: team.name,
						solves: team.submissions.filter((submission) => {
							return submission.contestId === contest.id && submission.state === 'Correct';
						}).length,
						time: (() => {
							const correctSubmissions = team.submissions.filter((submission) => {
								return submission.contestId === contest.id && submission.state === 'Correct';
							});
							const penaltyTime =
								team.submissions.filter((submission) => {
									return (
										submission.contestId === contest.id &&
										submission.state === 'Incorrect' &&
										correctSubmissions.find((correct) => {
											return (
												correct.problemId === submission.problemId &&
												submission.createdAt < correct.createdAt
											);
										})
									);
								}).length * 10;
							let time = penaltyTime;
							correctSubmissions.forEach((correctSubmission) => {
								const gradedAt = correctSubmission.gradedAt!.valueOf();
								const min = (gradedAt - contest.startTime!.valueOf()) / 60000;
								time += min;
							});
							return time;
						})(),
						problems: contest.problems.map((problem) => {
							return {
								id: problem.id,
								attempts: team.submissions.filter((submission) => {
									const correct = team.submissions.find((s) => {
										s.contestId === contest.id &&
											s.problemId === problem.id &&
											s.state === 'Correct';
									});
									if (correct !== undefined && submission.state === 'Incorrect') {
										return (
											submission.contestId === contest.id &&
											submission.problemId === problem.id &&
											submission.createdAt < correct.createdAt
										);
									} else {
										return (
											submission.contestId === contest.id &&
											submission.problemId === problem.id &&
											(submission.state === 'Correct' || submission.state === 'Incorrect')
										);
									}
								}).length,
								graphic: team.submissions.find((submission) => {
									return (
										submission.contestId === contest.id &&
										submission.problemId === problem.id &&
										(submission.state === 'Correct' || submission.state === 'Incorrect')
									);
								})
									? team.submissions.find((submission) => {
											return submission.problemId === problem.id && submission.state === 'Correct';
										})
										? 'correct'
										: 'incorrect'
									: null,
								min: (() => {
									const correctSubmission = team.submissions.find((submission) => {
										return (
											submission.contestId === contest.id &&
											submission.problemId === problem.id &&
											submission.state === 'Correct'
										);
									});
									if (correctSubmission) {
										const gradedAt = correctSubmission.gradedAt!.valueOf();
										return (gradedAt - contest.startTime!.valueOf()) / 60000;
									}
									return undefined;
								})()
							};
						})
					};
				})
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
				})
		}
	};
}
