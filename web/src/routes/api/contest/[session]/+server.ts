import { db } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async ({ params }) => {
	const session = params.session;
	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: session },
		include: { contest: { include: { problems: true } } }
	});
	if (!activeTeam) {
		return json({ success: false });
	}
	return json({
		success: true,
		contestId: activeTeam.contestId,
		teamId: activeTeam.teamId,
		problems: activeTeam.contest.problems.map((problem) => {
			return {
				id: problem.id,
				name: problem.friendlyName,
				pascalName: problem.pascalName,
				sampleInput: problem.sampleInput,
				sampleOutput: problem.sampleOutput
			};
		})
	});
}) satisfies RequestHandler;
