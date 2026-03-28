import z from 'zod';

export const contestSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	startTime: z.coerce.date().nullable(),
	freezeTime: z.coerce.date().nullable(),
	isFrozen: z.boolean(),
	activeTeamsCount: z.number().int(),
	isActive: z.boolean()
});
export type Contest = z.infer<typeof contestSchema>;
