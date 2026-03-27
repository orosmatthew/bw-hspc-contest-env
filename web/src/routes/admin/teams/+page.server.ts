import { teamRepo } from '$lib/server/repos';
import z from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { teamLanguageValues } from '$lib/server/repos/team-repo';
import { genTeamPassword } from '$lib/common/utils';

export const load: PageServerLoad = async () => {
	const teams = await teamRepo.getAllPrivate();
	return { teams };
};

const addSchema = z.object({
	name: z.string().min(1),
	lang: z.enum(teamLanguageValues)
});

const deleteSchema = z.object({
	teamId: z.coerce.number().int()
});

const editSchema = z.object({
	id: z.coerce.number().int(),
	name: z.string().min(1),
	lang: z.enum(teamLanguageValues),
	password: z.string().min(1)
});

export const actions: Actions = {
	add: async ({ request }) => {
		const form = addSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const id = await teamRepo.create({
			name: form.data.name,
			language: form.data.lang,
			password: genTeamPassword()
		});
		if (id === undefined) {
			return { success: false, message: 'Unable to create team' };
		}
		return { success: true };
	},
	delete: async ({ request }) => {
		const form = deleteSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const deleteSuccess = await teamRepo.deleteById(form.data.teamId);
		if (deleteSuccess !== true) {
			return { success: false, message: 'Unable to delete team' };
		}
		return { success: true };
	},
	edit: async ({ request }) => {
		const form = editSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) {
			return { success: false, message: 'Invalid form data' };
		}
		const updateSuccess = await teamRepo.update(form.data.id, {
			name: form.data.name,
			language: form.data.lang,
			password: form.data.password
		});
		if (updateSuccess !== true) {
			return { success: false, message: 'Unable to update team' };
		}
		return { success: true };
	}
};
