import z from 'zod';

export function createApiResultDtoSchema<T>(dataType: z.ZodType<T>) {
	return z.union([
		z.object({ success: z.literal(false), message: z.string() }),
		z.object({ success: z.literal(true), data: dataType })
	]);
}

export const problemPrivateDtoSchema = z.object({
	id: z.number().int(),
	friendlyName: z.string(),
	pascalName: z.string(),
	sampleInput: z.string(),
	sampleOutput: z.string(),
	realInput: z.string(),
	realOutput: z.string(),
	inputSpec: z.string().nullable()
});
export type ProblemPrivateDto = z.infer<typeof problemPrivateDtoSchema>;

export const contestDtoSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	startTime: z.coerce.date().nullable(),
	freezeTime: z.coerce.date().nullable(),
	isFrozen: z.boolean(),
	activeTeamsCount: z.number().int(),
	isActive: z.boolean()
});
export type ContestDto = z.infer<typeof contestDtoSchema>;

export const problemPublicDtoSchema = z.object({
	id: z.number().int(),
	friendlyName: z.string(),
	pascalName: z.string(),
	sampleInput: z.string(),
	sampleOutput: z.string()
});
export type ProblemPublicDto = z.infer<typeof problemPublicDtoSchema>;

export const activeTeamPrivateDtoSchema = z.object({
	id: z.number().int(),
	teamId: z.number().int(),
	contestId: z.number().int(),
	sessionToken: z.string().nullable(),
	sessionCreatedAt: z.coerce.date().nullable()
});
export type ActiveTeamPrivateDto = z.infer<typeof activeTeamPrivateDtoSchema>;

export const submissionStateDtoSchema = z.enum(['queued', 'in_review', 'correct', 'incorrect']);
export type SubmissionStateDto = z.infer<typeof submissionDtoSchema>;

export const submissionStateReasonDtoSchema = z.enum([
	'build_error',
	'time_limit_exceeded',
	'incorrect_overridden_as_correct',
	'sandbox_error'
]);
export type SubmissionStateReasonDto = z.infer<typeof submissionStateReasonDtoSchema>;

export const submissionDtoSchema = z.object({
	id: z.number().int(),
	createdAt: z.coerce.date(),
	gradedAt: z.coerce.date().nullable(),
	state: submissionStateDtoSchema,
	stateReason: submissionStateReasonDtoSchema.nullable(),
	stateReasonDetails: z.string().nullable(),
	actualOutput: z.string().nullable(),
	testCaseResults: z.string().nullable(),
	exitCode: z.number().nullable(),
	runtimeMilliseconds: z.number().nullable(),
	commitHash: z.string(),
	diff: z.string().nullable(),
	message: z.string().nullable(),
	teamId: z.number().int(),
	problemId: z.number().int(),
	contestId: z.number().int(),
	teamName: z.string()
});
export type SubmissionDto = z.infer<typeof submissionDtoSchema>;

