import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activeTeamRepo, problemRepo } from '$lib/server/repos';

export const GET: RequestHandler = async ({ params }) => {
	const session = params.session;
	const activeTeam = await activeTeamRepo.getBySessionTokenPublic(session);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}
	const problems = await problemRepo.getInContestPublic(activeTeam.contestId);
	return json({
		success: true,
		contestId: activeTeam.contestId,
		teamId: activeTeam.teamId,
		problems
	});
};
