import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw redirect(302, '/public/scoreboard');
	}
	const timestamp = new Date();
	const contestQuery = await db.contest.findUnique({ where: { id: contestId } });
	if (contestQuery === null) {
		throw redirect(302, '/public/scoreboard');
	}

	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: {
			problems: true,
			teams: {
				include: {
					submissions:
						contestQuery.freezeTime === null
							? true
							: { where: { createdAt: { lt: contestQuery.freezeTime } } }
				}
			}
		}
	});
	if (contest === null) {
		throw redirect(302, '/public/scoreboard');
	}
	const data = {
		timestamp: timestamp,
		frozen: contest.freezeTime !== null ? contest.freezeTime < new Date() : false,
		selected: {
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
											return correct.problemId === submission.problemId;
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
									return (
										submission.contestId === contest.id &&
										submission.problemId === problem.id &&
										(submission.state === 'Correct' || submission.state === 'Incorrect')
									);
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
	return data;
}) satisfies PageServerLoad;
