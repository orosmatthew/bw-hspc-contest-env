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
			problems: { id: number; attempts: number; graphic: string | null; min: number | undefined }[];
		}[];
	};
};

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
			teams: contest.teams
				.map((team) => {
					return {
						id: team.id,
						name: team.name,
						solves: team.submissions.filter((submission) => {
							return submission.contestId === contest.id && submission.state === 'Correct';
						}).length,
						time: (() => {
							const correctSubmissions = team.submissions
								.filter((submission) => {
									return submission.contestId === contest.id && submission.state === 'Correct';
								})
								.toSorted((a, b) => a.contestId.valueOf() - b.createdAt.valueOf());
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
								if (correctSubmission.gradedAt === null || contest.startTime === null) {
									throw new Error(
										"correctSubmission.gradedAt === null || contest.startTime === null was true when it shouldn't"
									);
								}
								const gradedAt = correctSubmission.gradedAt.valueOf();
								const min = (gradedAt - contest.startTime.valueOf()) / 60000;
								time += min;
							});
							return time;
						})(),
						problems: contest.problems.map((problem) => {
							return {
								id: problem.id,
								attempts: team.submissions.filter((submission) => {
									const correct = team.submissions
										.toSorted((a, b) => a.contestId.valueOf() - b.createdAt.valueOf())
										.find(
											(s) =>
												s.contestId === contest.id &&
												s.problemId === problem.id &&
												s.state === 'Correct'
										);
									if (
										correct !== undefined &&
										(submission.state === 'Incorrect' ||
											submission.state === 'Queued' ||
											submission.state === 'InReview')
									) {
										return (
											submission.contestId === contest.id &&
											submission.problemId === problem.id &&
											submission.createdAt < correct.createdAt
										);
									} else {
										return (
											submission.contestId === contest.id &&
											submission.problemId === problem.id &&
											(submission.state === 'Correct' ||
												submission.state === 'Incorrect' ||
												submission.state === 'InReview' ||
												submission.state === 'Queued')
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
									const correctSubmission = team.submissions
										.toSorted((a, b) => a.contestId.valueOf() - b.createdAt.valueOf())
										.find((submission) => {
											return (
												submission.contestId === contest.id &&
												submission.problemId === problem.id &&
												submission.state === 'Correct'
											);
										});
									if (correctSubmission) {
										if (correctSubmission.gradedAt === null || contest.startTime === null) {
											throw new Error(
												"correctSubmission.gradedAt === null || contest.startTime === null is true when it shouldn't"
											);
										}
										const gradedAt = correctSubmission.gradedAt.valueOf();
										return (gradedAt - contest.startTime.valueOf()) / 60000;
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
