import z from 'zod';
import {
	activeTeamPrivateDtoSchema,
	contestDtoSchema,
	createApiResultDtoSchema,
	problemPublicDtoSchema,
	submissionDtoSchema,
	teamPublicDtoSchema
} from './common-types';

export const getDataResDtoSchema = createApiResultDtoSchema(
	z.object({
		activeTeam: activeTeamPrivateDtoSchema,
		contest: contestDtoSchema,
		problems: z.array(problemPublicDtoSchema),
		submissions: z.array(submissionDtoSchema),
		team: teamPublicDtoSchema
	})
);
export type GetDataResDto = z.infer<typeof getDataResDtoSchema>;

export const postSubmissionReqDtoSchema = z.object({
	commitHash: z.string(),
	problemId: z.number().int()
});
export type PostSubmissionReqDto = z.infer<typeof postSubmissionReqDtoSchema>;

export const postSubmissionResDtoSchema = createApiResultDtoSchema(
	z.object({ submission: submissionDtoSchema })
);
export type PostSubmissionResDto = z.infer<typeof postSubmissionResDtoSchema>;

export const postLoginReqDtoSchema = z.object({
	teamName: z.string(),
	password: z.string()
});
export type PostLoginReqDto = z.infer<typeof postLoginReqDtoSchema>;

export const postLoginResDtoSchema = createApiResultDtoSchema(
	z.object({ activeTeam: activeTeamPrivateDtoSchema })
);
export type PostLoginResDto = z.infer<typeof postLoginResDtoSchema>;

export const postLogoutResDtoSchema = createApiResultDtoSchema(z.undefined());
export type PostLogoutResDto = z.infer<typeof postLogoutResDtoSchema>;
