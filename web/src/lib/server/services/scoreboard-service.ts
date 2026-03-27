import { contestRepo, problemRepo, submissionRepo, teamRepo } from '../repos';
import type { ProblemPublic } from '../repos/problem-repo';
import type { Submission } from '../repos/submission-repo';
import type { TeamPublic } from '../repos/team-repo';

export type ScoreboardTeamProblemGraphic = 'correct' | 'incorrect' | undefined;

export type ScoreboardTeamProblem = {
	id: number;
	attempts: number;
	graphic: ScoreboardTeamProblemGraphic;
	min: number | undefined;
};

export type ScoreboardTeam = {
	id: number;
	name: string;
	solves: number;
	time: number;
	problems: Array<ScoreboardTeamProblem>;
};

export type ScoreboardContest = {
	id: number;
	name: string;
	problems: Array<ProblemPublic>;
	teams: Array<ScoreboardTeam>;
};

export type Scoreboard = {
	timestamp: Date;
	isFrozen: boolean;
	contest: ScoreboardContest;
};

type ContestData = {
	id: number;
	name: string;
	startTime: Date;
	problems: Array<ProblemPublic>;
	teams: Array<TeamPublic>;
	submissions: Array<Submission>;
};

export class ScoreboardService {
	async getForContest(contestId: number): Promise<Scoreboard | undefined> {
		const contest = await contestRepo.getById(contestId);
		if (contest === undefined || contest.startTime === null) {
			return undefined;
		}
		const problems = await problemRepo.getInContestPublic(contest.id);
		const teams = await teamRepo.getInContestPublic(contest.id);
		const submissions = await submissionRepo.getInContest(contest.id);
		const contestData: ContestData = {
			id: contest.id,
			name: contest.name,
			startTime: contest.startTime,
			problems,
			teams,
			submissions
		};
		const scoreboardContest = this._getScoreboardContest({
			contestData
		});
		return {
			timestamp: new Date(),
			isFrozen: contest.isFrozen,
			contest: scoreboardContest
		};
	}

	private _getScoreboardContest(params: { contestData: ContestData }): ScoreboardContest {
		const teams = this._getScoreboardTeams({
			contestData: params.contestData
		});
		return {
			id: params.contestData.id,
			name: params.contestData.name,
			problems: params.contestData.problems,
			teams
		};
	}

	private _getScoreboardTeams(params: { contestData: ContestData }): Array<ScoreboardTeam> {
		const scoreboardTeams: Array<ScoreboardTeam> = [];
		for (const team of params.contestData.teams) {
			const correctSubmissions = this._getTeamCorrectSubmissions({
				contestData: params.contestData,
				teamId: team.id
			});
			const teamTime = this._getTeamTime({
				contestData: params.contestData,
				correctSubmissions,
				teamId: team.id
			});
			const problems = this._getTeamProblems({
				contestData: params.contestData,
				teamId: team.id
			});
			scoreboardTeams.push({
				id: team.id,
				name: team.name,
				solves: correctSubmissions.length,
				time: teamTime,
				problems
			});
		}
		scoreboardTeams.sort((a, b) => {
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
		return scoreboardTeams;
	}

	private _getTeamCorrectSubmissions(params: {
		contestData: ContestData;
		teamId: number;
	}): Array<Submission> {
		const correctSubmissions = params.contestData.submissions.filter(
			(s) => s.teamId === params.teamId && s.state === 'correct'
		);
		const dedupedSubmissions: Array<Submission> = [];
		for (const submission of correctSubmissions) {
			const existingIndex = dedupedSubmissions.findIndex(
				(s) => s.problemId === submission.problemId
			);
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

	private _getTeamTime(params: {
		contestData: ContestData;
		teamId: number;
		correctSubmissions: Array<Submission>;
	}): number {
		const incorrectSubmissions = params.contestData.submissions.filter(
			(s) => s.teamId === params.teamId && s.state === 'incorrect'
		);
		const incorrectSubmissionsBeforeCorrect = incorrectSubmissions.filter((s) =>
			params.correctSubmissions.some(
				(c) => c.problemId === s.problemId && s.createdAt < c.createdAt
			)
		);
		const penaltyTime = incorrectSubmissionsBeforeCorrect.length * 10;
		let time = penaltyTime;
		for (const correct of params.correctSubmissions) {
			time += (correct.createdAt.valueOf() - params.contestData.startTime.valueOf()) / (60 * 1000);
		}
		return time;
	}

	private _getTeamProblems(params: {
		contestData: ContestData;
		teamId: number;
	}): Array<ScoreboardTeamProblem> {
		const teamProblems: Array<ScoreboardTeamProblem> = [];
		for (const problem of params.contestData.problems) {
			const problemSubmissions = params.contestData.submissions.filter(
				(s) => s.teamId === params.teamId && s.problemId === problem.id
			);
			const attempts = this._getTeamProblemAttempts({ problemSubmissions });
			const graphic = this._getTeamProblemGraphic({ problemSubmissions });
			const min = this._getTeamProblemMin({
				contestStartTime: params.contestData.startTime,
				problemSubmissions
			});
			teamProblems.push({ id: problem.id, attempts: attempts.length, graphic, min });
		}
		return teamProblems;
	}

	private _getTeamProblemAttempts(params: {
		problemSubmissions: Array<Submission>;
	}): Array<Submission> {
		const correct = params.problemSubmissions
			.toSorted((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
			.find((s) => s.state === 'correct');
		return correct !== undefined
			? params.problemSubmissions.filter((s) => s.createdAt <= correct.createdAt)
			: params.problemSubmissions;
	}

	private _getTeamProblemGraphic(params: {
		problemSubmissions: Array<Submission>;
	}): ScoreboardTeamProblemGraphic {
		if (params.problemSubmissions.some((s) => s.state === 'correct')) {
			return 'correct';
		} else if (params.problemSubmissions.some((s) => s.state === 'incorrect')) {
			return 'incorrect';
		}
		return undefined;
	}

	private _getTeamProblemMin(params: {
		contestStartTime: Date;
		problemSubmissions: Array<Submission>;
	}): number | undefined {
		const correctSubmission = params.problemSubmissions
			.toSorted((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
			.find((s) => s.state === 'correct');
		if (correctSubmission === undefined) {
			return undefined;
		}
		return (
			(correctSubmission.createdAt.valueOf() - params.contestStartTime.valueOf()) / (60 * 1000)
		);
	}
}
