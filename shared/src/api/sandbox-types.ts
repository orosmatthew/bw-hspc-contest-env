import z from 'zod';
import {
	createApiResultDtoSchema,
	problemPrivateDtoSchema,
	submissionDtoSchema
} from './common-types';

export const getSubmissionResDtoSchema = createApiResultDtoSchema(
	z.object({ submission: submissionDtoSchema, problem: problemPrivateDtoSchema }).nullable()
);
export type GetSubmissionResDto = z.infer<typeof getSubmissionResDtoSchema>;

export const runResultKindDtoSchema = z.enum([
	'compileFailed',
	'timeLimitExceeded',
	'completed',
	'runError'
]);
export type RunResultKindDto = z.infer<typeof runResultKindDtoSchema>;

export const sourceFileWithTextDtoSchema = z.object({
	pathFromProblemRoot: z.string(),
	contest: z.string()
});
export type SourceFileWithTextDto = z.infer<typeof sourceFileWithTextDtoSchema>;

export const runResultDtoSchema = z.object({
	kind: runResultKindDtoSchema,
	output: z.string().nullable(),
	exitCode: z.number().nullable(),
	runtimeMilliseconds: z.number().nullable(),
	resultKindReason: z.string().nullable(),
	sourceFiles: z.array(sourceFileWithTextDtoSchema).nullable()
});
export type RunResultDto = z.infer<typeof runResultDtoSchema>;

export const postSubmissionReqDto = z.object({
	submissionId: z.number().int(),
	result: runResultDtoSchema
});
export type PostSubmissionReqDto = z.infer<typeof postSubmissionReqDto>;

export const postSubmissionResDto = createApiResultDtoSchema(z.undefined());
export type PostSubmissionResDto = z.infer<typeof postSubmissionResDto> 