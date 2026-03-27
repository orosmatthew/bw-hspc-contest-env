import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activeTeamRepo, problemRepo } from '$lib/server/repos';
import { getBearerToken } from '$lib/common/utils';

export const GET: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}
	const activeTeam = await activeTeamRepo.getBySessionTokenPublic(token);
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
