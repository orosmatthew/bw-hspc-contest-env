import { db } from '$lib/server/prisma';
import type { Actions } from './$types';

export const actions = {
	create: async ({ request }) => {
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

		try {
			await db.problem.create({
				data: {
					pascalName: pascalName.toString(),
					friendlyName: name.toString(),
					sampleInput: sampleInput.toString(),
					sampleOutput: sampleOutput.toString(),
					realInput: realInput.toString(),
					realOutput: realOutput.toString()
				}
			});
		} catch {
			return { success: false };
		}

		return { success: true };
	}
} satisfies Actions;
