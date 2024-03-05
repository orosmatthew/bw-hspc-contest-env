import { db } from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	ContestStateForExtension,
	FullStateForExtension,
	SubmissionForExtension
} from '$lib/contestMonitor/contestMonitorSharedTypes';
import { convertSubmissionStateForExtension } from '$lib/contestMonitor/contestMonitorUtils';

export const GET = (async ({ params }) => {
	const sessionToken = params.session;
	if (!sessionToken) {
		error(400);
	}

	const activeTeam = await db.activeTeam.findUnique({
		where: { sessionToken: sessionToken },
		include: {
			contest: { include: { problems: { select: { id: true, friendlyName: true } } } },
			team: { include: { submissions: true } }
		}
	});
	if (!activeTeam) {
		// Team "logged in", but the token doesn't match
		// Maybe they're still logged into a previous contest?
		error(400);
	}

	const submissions: SubmissionForExtension[] = activeTeam.team.submissions
		.filter((s) => s.contestId == activeTeam.contestId)
		.map<SubmissionForExtension>((s) => ({
			id: s.id,
			contestId: s.contestId,
			teamId: s.teamId,
			problemId: s.problemId,
			createdAt: s.createdAt,
			state: convertSubmissionStateForExtension(s.state),
			message: s.message
		}));

	const contestState: ContestStateForExtension = {
		startTime: activeTeam.contest.startTime,
		endTime: null,
		problems: activeTeam.contest.problems,
		isActive: true, // todo
		isScoreboardFrozen: false // todo
	};

	const fullState: FullStateForExtension = {
		submissions: submissions,
		contestState: contestState
	};

	return json({ success: true, data: fullState });
}) satisfies RequestHandler;
