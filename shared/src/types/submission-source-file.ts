import z from 'zod';

export const submissionSourceFileSchema = z.object({
	id: z.number().int(),
	submissionId: z.number().int(),
	pathFromProblemRoot: z.string(),
	content: z.string()
});
export type SubmissionSourceFile = z.infer<typeof submissionSourceFileSchema>;
