import z from 'zod';

export function createApiResultSchema<T>(dataType: z.ZodType<T>) {
	return z.union([
		z.object({ success: z.literal(false), message: z.string() }),
		z.object({ success: z.literal(true), data: dataType })
	]);
}
