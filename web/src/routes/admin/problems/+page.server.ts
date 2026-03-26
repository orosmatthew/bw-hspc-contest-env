import { parseProblemInput } from '$lib/common/output-analyzer/input-analyzer';
import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const query = await db.problem.findMany({ orderBy: { friendlyName: 'asc' } });
	return {
		problems: query.map((row) => {
			return {
				id: row.id,
				friendlyName: row.friendlyName,
				inputSpec: row.inputSpec,
				parsedInput: parseProblemInput(row)
			};
		})
	};
}) satisfies PageServerLoad;
