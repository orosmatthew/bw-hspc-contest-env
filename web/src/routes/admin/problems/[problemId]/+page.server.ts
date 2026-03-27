import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import z from 'zod';
import { problemRepo } from '$lib/server/repos';

export const load: PageServerLoad = async ({ params }) => {
	const problemIdParse = z.coerce.number().int().safeParse(params.problemId);
	if (!problemIdParse.success) {
		error(400, { message: 'Invalid problem id' });
	}
	const problem = await problemRepo.getByIdPrivate(problemIdParse.data);
	if (problem === undefined) {
		redirect(307, '/admin/problems');
	}
	return { problem };
};

const editSchema = z.object({
	friendlyName: z.string().min(1),
	pascalName: z.string().min(1),
	sampleInput: z.string(),
	sampleOutput: z.string(),
	realInput: z.string(),
	realOutput: z.string(),
	inputSpec: z
		.string()
		.nullable()
		.transform((v) => (v !== null ? v.trim() : null))
});

export const actions: Actions = {
	edit: async ({ params, request }) => {
		const problemIdParse = z.coerce.number().int().safeParse(params.problemId);
		if (!problemIdParse.success) {
			error(400, { message: 'Invalid problem id' });
		}
		const form = editSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const updateSuccess = await problemRepo.update(problemIdParse.data, {
			friendlyName: form.data.friendlyName,
			pascalName: form.data.pascalName,
			sampleInput: form.data.sampleInput,
			sampleOutput: form.data.sampleOutput,
			realInput: form.data.realInput,
			realOutput: form.data.realOutput,
			inputSpec: form.data.inputSpec
		});
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update problem' };
		}
		return { success: true };
	}
};
