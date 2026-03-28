import z from 'zod';

export const submissionStateReasonValues = [
	'build_error',
	'time_limit_exceeded',
	'incorrect_overridden_as_correct',
	'sandbox_error'
] as const;
export const submissionStateReasonSchema = z.enum(submissionStateReasonValues);
export type SubmissionStateReason = z.infer<typeof submissionStateReasonSchema>;

export const submissionStateValues = ['queued', 'in_review', 'correct', 'incorrect'] as const;
export const submissionStateSchema = z.enum(submissionStateValues);
export type SubmissionState = z.infer<typeof submissionStateSchema>;

export const submissionSchema = z.object({
	id: z.number().int(),
	createdAt: z.coerce.date(),
	gradedAt: z.coerce.date().nullable(),
	state: submissionStateSchema,
	stateReason: submissionStateReasonSchema.nullable(),
	stateReasonDetails: z.string().nullable(),
	actualOutput: z.string().nullable(),
	testCaseResults: z.string().nullable(),
	exitCode: z.number().int().nullable(),
	runtimeMilliseconds: z.number().int().nullable(),
	commitHash: z.string(),
	diff: z.string().nullable(),
	message: z.string().nullable(),
	teamId: z.number().int(),
	problemId: z.number().int(),
	contestId: z.number().int(),
	teamName: z.string()
});
export type Submission = z.infer<typeof submissionSchema>;
