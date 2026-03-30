import z from 'zod';
import { createApiResultSchema } from './common';
import { problemPrivateSchema } from '../problem';
import { submissionPrivateSchema } from '../submission';
import { teamPrivateSchema } from '../team';
import { runResultSchema } from '../../submission-runner/common';

export const getSubmissionResSchema = createApiResultSchema(
	z
		.object({
			submission: submissionPrivateSchema,
			problem: problemPrivateSchema,
			team: teamPrivateSchema
		})
		.nullable()
);
export type GetSubmissionRes = z.infer<typeof getSubmissionResSchema>;

export const sourceFileWithTextSchema = z.object({
	pathFromProblemRoot: z.string(),
	contest: z.string()
});
export type SourceFileWithText = z.infer<typeof sourceFileWithTextSchema>;

export const postSubmissionReqSchema = z.object({
	submissionId: z.number().int(),
	result: runResultSchema
});
export type PostSubmissionReq = z.infer<typeof postSubmissionReqSchema>;

export const postSubmissionResSchema = createApiResultSchema(z.undefined());
export type PostSubmissionRes = z.infer<typeof postSubmissionResSchema>;
