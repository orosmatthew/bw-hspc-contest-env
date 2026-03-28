import z from 'zod';

export const problemBaseSchema = z.object({
	id: z.number().int(),
	friendlyName: z.string(),
	pascalName: z.string(),
	sampleInput: z.string(),
	sampleOutput: z.string()
});
export type ProblemBase = z.infer<typeof problemBaseSchema>;

export const problemPublicSchema = problemBaseSchema;
export type ProblemPublic = z.infer<typeof problemPublicSchema>;

export const problemPrivateSchema = z.object({
	...problemBaseSchema.shape,
	realInput: z.string(),
	realOutput: z.string(),
	inputSpec: z.string().nullable()
});
export type ProblemPrivate = z.infer<typeof problemPrivateSchema>;
