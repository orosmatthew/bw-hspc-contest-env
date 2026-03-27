import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { activeTeamRepo, contestRepo, problemRepo } from '$lib/server/repos';
import { getBearerToken } from '$lib/common/utils';
import type { GetContestResDto } from 'bwcontest-shared/api/client-types';

export const GET: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetContestResDto, {
			status: 401
		});
	}
	const activeTeam = await activeTeamRepo.getBySessionTokenPrivate(token);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetContestResDto, {
			status: 401
		});
	}
	const contest = await contestRepo.getById(activeTeam.contestId);
	if (contest === undefined) {
		return json({ success: false, message: 'Contest is undefined' } satisfies GetContestResDto, {
			status: 401
		});
	}
	const problems = await problemRepo.getInContestPublic(activeTeam.contestId);
	return json({
		success: true,
		data: { activeTeam, contest, problems }
	} satisfies GetContestResDto);
};
