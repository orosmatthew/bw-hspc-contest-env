import z from 'zod';
import { createApiResultSchema } from './common';
import { activeTeamPrivateSchema } from '../active-team';
import { contestSchema } from '../contest';
import { problemPublicSchema } from '../problem';
import { teamPublicSchema } from '../team';
import { submissionPublicSchema } from '../submission';

export const getDataResSchema = createApiResultSchema(
	z.object({
		activeTeam: activeTeamPrivateSchema,
		contest: contestSchema,
		problems: z.array(problemPublicSchema),
		submissions: z.array(submissionPublicSchema),
		team: teamPublicSchema
	})
);
export type GetDataRes = z.infer<typeof getDataResSchema>;

export const postSubmissionReqSchema = z.object({
	commitHash: z.string(),
	problemId: z.number().int()
});
export type PostSubmissionReq = z.infer<typeof postSubmissionReqSchema>;

export const postSubmissionResSchema = createApiResultSchema(
	z.object({ submission: submissionPublicSchema })
);
export type PostSubmissionRes = z.infer<typeof postSubmissionResSchema>;

export const postLoginReqSchema = z.object({ teamName: z.string(), password: z.string() });
export type PostLoginReq = z.infer<typeof postLoginReqSchema>;

export const postLoginResSchema = createApiResultSchema(
	z.object({ activeTeam: activeTeamPrivateSchema })
);
export type PostLoginRes = z.infer<typeof postLoginResSchema>;

export const postLogoutResSchema = createApiResultSchema(z.undefined());
export type PostLogoutRes = z.infer<typeof postLogoutResSchema>;
