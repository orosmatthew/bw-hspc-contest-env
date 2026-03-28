import z from 'zod';

export const teamLanguageValues = ['java', 'csharp', 'cpp', 'python'] as const;
export const teamLanguageSchema = z.enum(teamLanguageValues);
export type TeamLanguage = z.infer<typeof teamLanguageSchema>;

export const teamBaseSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	language: teamLanguageSchema,
	hasActiveTeam: z.boolean()
});
export type TeamBase = z.infer<typeof teamBaseSchema>;

export const teamPublicSchema = teamBaseSchema;
export type TeamPublic = z.infer<typeof teamBaseSchema>;

export const teamPrivateSchema = z.object({
	...teamBaseSchema.shape,
	password: z.string()
});
export type TeamPrivate = z.infer<typeof teamPrivateSchema>;
