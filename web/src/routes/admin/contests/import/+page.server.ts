import { db } from '$lib/server/prisma';
import { Language, SubmissionState } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { genPassword } from '../../teams/util';

export const load = (async () => {}) satisfies PageServerLoad;

export type ContestImportData = {
	Name: string;
	Problems: ProblemImportData[];
	Teams: TeamImportData[];
	Submissions: SubmissionImportData[];
};

export type ProblemImportData = {
	ProblemName: string;
	ShortName: string;
	SampleInput: string;
	SampleOutput: string;
	RealInput: string;
	RealOutput: string;
};

export type TeamImportData = {
	TeamName: string;
};

export type SubmissionImportData = {
	TeamName: string;
	ProblemShortName: string;
	State: string;
	SubmitTime: number;
	TeamOutput: string;
	Code: string | null;
	Language: 'Java' | 'C#' | 'C++' | null;
};

export const actions = {
	default: async ({ request }) => {
		let parsedContest: ContestImportData;
		let includeSubmissions: boolean;

		try {
			const formData = await request.formData();
			const contestJson = formData.get('jsonText')?.toString();
			if (!contestJson) {
				return fail(400, { message: 'Could not get json text' });
			}

			parsedContest = JSON.parse(contestJson);
			includeSubmissions = formData.get('includeSubmissions')?.toString() == 'on';
		} catch (err) {
			return fail(400, { message: 'Could not parse contest data: ' + err?.toString() });
		}

		try {
			let contestStart: Date | null = null;
			let hasSubmissions = false;

			if (includeSubmissions && parsedContest.Submissions.length > 0) {
				hasSubmissions = true;

				const maxSubmitTimeMinutes = Math.max(
					...parsedContest.Submissions.map((s) => s.SubmitTime)
				);
				const now = new Date();
				contestStart = new Date(now.getTime() - maxSubmitTimeMinutes * 60 * 1000);
			}

			// Single transaction
			await db.contest.create({
				data: {
					name: parsedContest.Name,
					startTime: contestStart,
					teams: {
						connectOrCreate: parsedContest.Teams.map((team) => ({
							where: { name: team.TeamName },
							create: {
								name: team.TeamName,
								password: genPassword(),
								language: inferTeamLanguage(parsedContest, team) ?? Language.Java
							}
						}))
					},
					problems: {
						connectOrCreate: parsedContest.Problems.map((problem) => ({
							where: {
								friendlyName: problem.ProblemName,
								pascalName: problem.ShortName,
								sampleInput: problem.SampleInput,
								sampleOutput: problem.SampleOutput,
								realInput: problem.RealInput,
								realOutput: problem.RealOutput
							},
							create: {
								friendlyName: problem.ProblemName,
								pascalName: problem.ShortName,
								sampleInput: problem.SampleInput,
								sampleOutput: problem.SampleOutput,
								realInput: problem.RealInput,
								realOutput: problem.RealOutput
							}
						}))
					},
					submissions: {
						create: hasSubmissions
							? parsedContest.Submissions.toSorted((a, b) => a.SubmitTime - b.SubmitTime).map(
									(submission) => ({
										createdAt: dateFromContestMinutes(contestStart!, submission.SubmitTime),
										gradedAt: dateFromContestMinutes(contestStart!, submission.SubmitTime + 1),
										state: convertSubmissionState(submission),
										actualOutput: submission.TeamOutput,
										commitHash: '',
										problem: {
											connect: {
												pascalName: submission.ProblemShortName
											}
										},
										team: {
											connect: {
												name: submission.TeamName
											}
										}
									})
								)
							: []
					}
				}
			});
		} catch (err) {
			return fail(400, { message: 'Error updating database: ' + err?.toString() });
		}

		return redirect(303, '/admin/contests');
	}
} satisfies Actions;

function convertSubmissionState(submission: SubmissionImportData): SubmissionState {
	switch (submission.State) {
		case 'Correct':
			return SubmissionState.Correct;
		case 'Incorrect':
			return SubmissionState.Incorrect;
		default:
			return SubmissionState.InReview;
	}
}

function inferTeamLanguage(
	parsedContest: ContestImportData,
	team: TeamImportData
): Language | null {
	const submissionWithCode = parsedContest.Submissions.find(
		(s) => s.TeamName == team.TeamName && s.Code != null
	);
	if (!submissionWithCode) {
		return null;
	}

	switch (submissionWithCode.Language) {
		case 'Java':
			return Language.Java;
		case 'C#':
			return Language.CSharp;
		case 'C++':
			return Language.CPP;
		default:
			throw new Error('Unrecognized language: ' + submissionWithCode.Language);
	}
}

function dateFromContestMinutes(contestStart: Date, minutesFromStart: number): Date {
	return new Date(contestStart.getTime() + minutesFromStart * 60 * 1000);
}
