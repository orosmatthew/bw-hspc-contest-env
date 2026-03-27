import z from 'zod';
import type { Actions } from './$types';
import { problemRepo } from '$lib/server/repos';

const createSchema = z.object({
	friendlyName: z.string().min(1),
	pascalName: z.string().min(1),
	sampleInput: z.string(),
	sampleOutput: z.string(),
	realInput: z.string(),
	realOutput: z.string()
});

export const actions: Actions = {
	create: async ({ request }) => {
		const form = createSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const id = await problemRepo.create({
			friendlyName: form.data.friendlyName,
			pascalName: form.data.pascalName,
			sampleInput: form.data.sampleInput,
			sampleOutput: form.data.sampleOutput,
			realInput: form.data.realInput,
			realOutput: form.data.realOutput,
			inputSpec: null
		});
		if (id === undefined) {
			return { success: false, message: 'Unable to create problem' };
		}
		return { success: true };
	}
};
