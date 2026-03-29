import z from 'zod';

export const submissionStateReasonValues = [
	'buildError',
	'timeLimitExceeded',
	'incorrectOverriddenAsCorrect',
	'sandboxError'
] as const;
export const submissionStateReasonSchema = z.enum(submissionStateReasonValues);
export type SubmissionStateReason = z.infer<typeof submissionStateReasonSchema>;

export const submissionStateValues = ['queued', 'inReview', 'correct', 'incorrect'] as const;
export const submissionStateSchema = z.enum(submissionStateValues);
export type SubmissionState = z.infer<typeof submissionStateSchema>;

export const submissionDisplayStateValues = ['correct', 'incorrect', 'processing'] as const;
export const submissionDisplayStateSchema = z.enum(submissionDisplayStateValues);
export type SubmissionDisplayState = z.infer<typeof submissionDisplayStateSchema>;

export const submissionBaseSchema = z.object({
	id: z.number().int(),
	createdAt: z.coerce.date(),
	displayState: submissionDisplayStateSchema,
	commitHash: z.string(),
	message: z.string().nullable(),
	teamId: z.number().int(),
	problemId: z.number().int(),
	contestId: z.number().int(),
	teamName: z.string()
});
export type SubmissionBase = z.infer<typeof submissionBaseSchema>;

export const submissionPublicSchema = submissionBaseSchema;
export type SubmissionPublic = z.infer<typeof submissionPublicSchema>;

export const submissionPrivateSchema = z.object({
	...submissionBaseSchema.shape,
	gradedAt: z.coerce.date().nullable(),
	state: submissionStateSchema,
	stateReason: submissionStateReasonSchema.nullable(),
	stateReasonDetails: z.string().nullable(),
	actualOutput: z.string().nullable(),
	testCaseResults: z.string().nullable(),
	exitCode: z.number().int().nullable(),
	runtimeMilliseconds: z.number().int().nullable(),
	diff: z.string().nullable()
});
export type SubmissionPrivate = z.infer<typeof submissionPrivateSchema>;
