import z from 'zod';

export const adminSessionSchema = z.object({ token: z.string(), createdAt: z.coerce.date() });
export type AdminSession = z.infer<typeof adminSessionSchema>;
