import { db } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
	const selectedContestIdStr = url.searchParams.get('c');
	const selectedContestId = selectedContestIdStr === null ? null : parseInt(selectedContestIdStr);
	const timestamp = new Date();

	if (selectedContestId !== null) {
		const contest = await db.contest.findUnique({
			where: { id: selectedContestId },
			include: { problems: true, teams: { include: { submissions: true } } }
		});
		if (contest === null) {
			throw redirect(302, '/admin/scoreboard');
		}
		const data = {
			timestamp: timestamp,
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
												return (
													submission.problemId === problem.id && submission.state === 'Correct'
												);
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
	} else {
		return {
			timestamp: timestamp,
			contest: null
		};
	}
}) satisfies PageServerLoad;
