import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	activeTeamRepo,
	contestRepo,
	problemRepo,
	submissionRepo,
	teamRepo
} from '$lib/server/repos';
import { getBearerToken } from '$lib/common/utils';
import type { GetDataResDto } from 'bwcontest-shared/api/client-types';

export const GET: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetDataResDto, {
			status: 401
		});
	}
	const activeTeam = await activeTeamRepo.getBySessionTokenPrivate(token);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies GetDataResDto, {
			status: 401
		});
	}
	const contest = await contestRepo.getById(activeTeam.contestId);
	if (contest === undefined) {
		return json({ success: false, message: 'Contest is undefined' } satisfies GetDataResDto, {
			status: 500
		});
	}
	const problems = await problemRepo.getInContestPublic(activeTeam.contestId);
	const submissions = await submissionRepo.getInContestForTeam(
		activeTeam.contestId,
		activeTeam.teamId
	);
	const team = await teamRepo.getByIdPublic(activeTeam.teamId);
	if (team === undefined) {
		return json({ success: false, message: 'Team is undefined' } satisfies GetDataResDto, {
			status: 500
		});
	}
	return json({
		success: true,
		data: { activeTeam, contest, problems, submissions, team }
	} satisfies GetDataResDto);
};
