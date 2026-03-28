import z from 'zod';

export const activeTeamBaseSchema = z.object({
	id: z.number().int(),
	teamId: z.number().int(),
	contestId: z.number().int()
});
export type ActiveTeamBase = z.infer<typeof activeTeamBaseSchema>;

export const activeTeamPublicSchema = activeTeamBaseSchema;
export type ActiveTeamPublic = z.infer<typeof activeTeamPublicSchema>;

export const activeTeamPrivateSchema = z.object({
	...activeTeamBaseSchema.shape,
	sessionToken: z.string().nullable(),
	sessionCreatedAt: z.coerce.date().nullable()
});
export type ActiveTeamPrivate = z.infer<typeof activeTeamPrivateSchema>;
