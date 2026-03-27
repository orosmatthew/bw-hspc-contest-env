import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getBearerToken } from '$lib/common/utils';
import type { PostLogoutResDto } from 'bwcontest-shared/api/client-types';
import { activeTeamRepo } from '$lib/server/repos';

export const POST: RequestHandler = async ({ request }) => {
	const token = getBearerToken(request.headers);
	if (token === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostLogoutResDto, {
			status: 401
		});
	}
	const activeTeam = await activeTeamRepo.getBySessionTokenPrivate(token);
	if (activeTeam === undefined) {
		return json({ success: false, message: 'Unauthorized' } satisfies PostLogoutResDto, {
			status: 401
		});
	}
	const updateSuccess = await activeTeamRepo.update(activeTeam.id, {
		sessionToken: null,
		sessionCreatedAt: null
	});
	if (updateSuccess !== true) {
		return json(
			{ success: false, message: 'Unable to update active team' } satisfies PostLogoutResDto,
			{ status: 500 }
		);
	}
	return json({ success: true, data: undefined } satisfies PostLogoutResDto);
};
