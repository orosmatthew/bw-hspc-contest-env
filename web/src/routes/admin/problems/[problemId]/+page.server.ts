import { db } from '$lib/server/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const problemId = parseInt(params.problemId);
	if (isNaN(problemId)) {
		throw error(400, 'Invalid request');
	}
	const query = await db.problem.findUnique({ where: { id: problemId } });
	if (!query) {
		throw redirect(302, '/admin/problems');
	}
	return { problemData: query };
}) satisfies PageServerLoad;

export const actions = {
	edit: async ({ params, request }) => {
		const problemId = parseInt(params.problemId);
		if (isNaN(problemId)) {
			throw error(400, 'Invalid problem');
		}
		const data = await request.formData();
		const name = data.get('name');
		const pascalName = data.get('pascalName');
		const sampleInput = data.get('sampleInput');
		const sampleOutput = data.get('sampleOutput');
		const realInput = data.get('realInput');
		const realOutput = data.get('realOutput');
		if (!name || !pascalName || !sampleInput || !sampleOutput || !realInput || !realOutput) {
			return { success: false };
		}

		await db.problem.update({
			where: { id: problemId },
			data: {
				pascalName: pascalName.toString(),
				friendlyName: name.toString(),
				sampleInput: sampleInput.toString(),
				sampleOutput: sampleOutput.toString(),
				realInput: realInput.toString(),
				realOutput: realOutput.toString()
			}
		});

		return { success: true };
	}
} satisfies Actions;
