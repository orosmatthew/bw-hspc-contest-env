import z from 'zod';
import { createApiResultSchema } from './common';
import { problemPrivateSchema } from '../problem';
import { submissionPrivateSchema } from '../submission';

export const getSubmissionResSchema = createApiResultSchema(
	z.object({ submission: submissionPrivateSchema, problem: problemPrivateSchema }).nullable()
);
export type GetSubmissionRes = z.infer<typeof getSubmissionResSchema>;

export const runResultKindSchema = z.enum([
	'compileFailed',
	'timeLimitExceeded',
	'completed',
	'runError'
]);
export type RunResultKind = z.infer<typeof runResultKindSchema>;

export const sourceFileWithTextSchema = z.object({
	pathFromProblemRoot: z.string(),
	contest: z.string()
});
export type SourceFileWithText = z.infer<typeof sourceFileWithTextSchema>;

export const runResultSchema = z.object({
	kind: runResultKindSchema,
	output: z.string().nullable(),
	exitCode: z.number().nullable(),
	runtimeMilliseconds: z.number().nullable(),
	resultKindReason: z.string().nullable(),
	sourceFiles: z.array(sourceFileWithTextSchema).nullable()
});
export type RunResult = z.infer<typeof runResultSchema>;

export const postSubmissionReqSchema = z.object({
	submissionId: z.number().int(),
	result: runResultSchema
});
export type PostSubmissionReq = z.infer<typeof postSubmissionReqSchema>;

export const postSubmissionResSchema = createApiResultSchema(z.undefined());
export type PostSubmissionRes = z.infer<typeof postSubmissionResSchema>;
