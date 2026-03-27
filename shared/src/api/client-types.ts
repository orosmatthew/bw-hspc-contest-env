import z from 'zod';
import {
	activeTeamPrivateDtoSchema,
	contestDtoSchema,
	createApiResultDtoSchema,
	problemPublicDtoSchema
} from './common-types';

export const getContestDtoSchema = createApiResultDtoSchema(
	z.object({
		activeTeam: activeTeamPrivateDtoSchema,
		contest: contestDtoSchema,
		problems: z.array(problemPublicDtoSchema)
	})
);
export type GetContestResDto = z.infer<typeof getContestDtoSchema>;
