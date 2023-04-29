import { db } from '$lib/server/prisma';
import type { Actions } from './$types';

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');
		const sampleInput = data.get('sampleInput');
		const sampleOutput = data.get('sampleOutput');
		const realInput = data.get('realInput');
		const realOutput = data.get('realOutput');
		if (!name || !sampleInput || !sampleOutput || !realInput || !realOutput) {
			return { success: false };
		}

		await db.problem.create({
			data: {
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
