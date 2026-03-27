import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import z from 'zod';
import {
	contestRepo,
	problemRepo,
	submissionRepo,
	submissionSourceFileRepo,
	teamRepo
} from '$lib/server/repos';
import type { SubmissionStateReason } from '$lib/server/repos/submission-repo';

export const load: PageServerLoad = async ({ params }) => {
	const submissionIdParse = z.coerce.number().safeParse(params.submissionId);
	if (!submissionIdParse.success) {
		error(400, { message: 'Invalid submission id' });
	}
	const submission = await submissionRepo.getById(submissionIdParse.data);
	if (submission === undefined) {
		redirect(307, '/admin/submissions');
	}
	const contest = await contestRepo.getById(submission.contestId);
	if (contest === undefined) {
		error(500, { message: 'Invalid contest' });
	}
	const team = await teamRepo.getByIdPrivate(submission.teamId);
	if (team === undefined) {
		error(500, { message: 'Invalid team' });
	}
	const problem = await problemRepo.getByIdPrivate(submission.problemId);
	if (problem === undefined) {
		error(500, { message: 'Invalid problem' });
	}
	const sourceFiles = await submissionSourceFileRepo.getForSubmission(submission.id);
	const submissionHistory = await submissionRepo.getInContestForTeamForProblem(
		submission.contestId,
		submission.teamId,
		submission.problemId
	);
	return {
		submission,
		contest,
		team,
		problem,
		sourceFiles,
		submissionHistory
	};
};

const submitGradeSchema = z.object({
	correct: z.string().transform((v) => (v.toLowerCase() === 'true' ? true : false)),
	message: z
		.string()
		.nullable()
		.transform((v) => v ?? '')
});

export const actions: Actions = {
	delete: async ({ params }) => {
		const submissionIdParse = z.coerce.number().int().safeParse(params.submissionId);
		if (!submissionIdParse.success) {
			return { success: false, message: 'Invalid submission id' };
		}
		const deleteSuccess = await submissionRepo.deleteById(submissionIdParse.data);
		if (deleteSuccess !== true) {
			return { success: false, message: 'Unable to delete submission' };
		}
		redirect(303, '/admin/submissions');
	},
	clearJudgment: async ({ params }) => {
		const submissionIdParse = z.coerce.number().int().safeParse(params.submissionId);
		if (!submissionIdParse.success) {
			return { success: false, message: 'Invalid submission id' };
		}
		const submission = await submissionRepo.getById(submissionIdParse.data);
		if (submission === undefined) {
			return { success: false, message: 'Submission not found' };
		}
		const newStateReason: SubmissionStateReason | null =
			submission.stateReason === 'incorrect_overridden_as_correct' ? null : submission.stateReason;
		const updateSuccess = await submissionRepo.update(submission.id, {
			state: 'in_review',
			gradedAt: null,
			message: null,
			stateReason: newStateReason
		});
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update submission' };
		}
		redirect(303, `/admin/submissions/${submission.id}`);
	},
	rerun: async ({ params }) => {
		const submissionIdParse = z.coerce.number().int().safeParse(params.submissionId);
		if (!submissionIdParse.success) {
			return { success: false, message: 'Invalid submission id' };
		}
		const sourceFilesDeleteSuccess = await submissionSourceFileRepo.deleteForSubmission(
			submissionIdParse.data
		);
		if (sourceFilesDeleteSuccess !== true) {
			return { success: false, message: 'Unable to delete submission source files' };
		}
		const updateSuccess = await submissionRepo.update(submissionIdParse.data, {
			state: 'queued',
			stateReason: null,
			stateReasonDetails: null,
			gradedAt: null,
			message: null,
			actualOutput: null,
			diff: null,
			exitCode: null,
			runtimeMilliseconds: null,
			testCaseResults: null
		});
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update submission' };
		}
		redirect(303, `/admin/submissions/${submissionIdParse.data}`);
	},
	submitGrade: async ({ request, params }) => {
		const submissionIdParse = z.coerce.number().int().safeParse(params.submissionId);
		if (!submissionIdParse.success) {
			return { success: false, message: 'Invalid submission id' };
		}
		const form = submitGradeSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const updateSuccess = await submissionRepo.update(submissionIdParse.data, {
			state: form.data.correct ? 'correct' : 'incorrect',
			stateReason: form.data.correct ? 'incorrect_overridden_as_correct' : null,
			message: form.data.message,
			gradedAt: new Date()
		});
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update submission' };
		}
		return { success: true };
	}
};
