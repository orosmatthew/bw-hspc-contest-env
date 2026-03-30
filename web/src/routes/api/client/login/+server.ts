import { postLoginReqSchema, type PostLoginRes } from 'bwcontest-shared/types/api/client';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { activeTeamRepo, teamRepo } from '$lib/server/repos';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	const req = postLoginReqSchema.safeParse(await request.json());
	if (req.success !== true) {
		return json({ success: false, message: 'Invalid POST data' } satisfies PostLoginRes, {
			status: 400
		});
	}
	const team = await teamRepo.getByNamePrivate(req.data.teamName.trim());
	if (team === undefined) {
		return json({ success: false, message: 'Team not found' } satisfies PostLoginRes, {
			status: 404
		});
	}
	if (team.password !== req.data.password) {
		return json({ success: false, message: 'Invalid password' } satisfies PostLoginRes, {
			status: 401
		});
	}
	const activeTeam = await activeTeamRepo.getForTeamPrivate(team.id);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Active team not found' } satisfies PostLoginRes, {
			status: 404
		});
	}
	const token = randomUUID();
	const updateSuccess = await activeTeamRepo.updateById(activeTeam.id, {
		sessionToken: token,
		sessionCreatedAt: new Date()
	});
	if (updateSuccess !== true) {
		return json(
			{ success: false, message: 'Unable to update active team' } satisfies PostLoginRes,
			{ status: 500 }
		);
	}
	const activeTeamNew = await activeTeamRepo.getBySessionTokenPrivate(token);
	if (activeTeamNew === undefined) {
		return json(
			{ success: false, message: 'Updated active team not found' } satisfies PostLoginRes,
			{ status: 500 }
		);
	}
	return json({ success: true, data: { activeTeam: activeTeamNew } } satisfies PostLoginRes);
};
