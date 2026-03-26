import { building } from '$app/environment';
import { AdminSessionRepo } from './admin-session-repo';
import { env } from '$env/dynamic/private';

export const adminSessionRepo = (
	building
		? undefined
		: new AdminSessionRepo({
				adminUsername: env.ADMIN_USERNAME,
				adminPassword: env.ADMIN_PASSWORD,
				expiresMinutes: 60 * 24 // day
			})
) as AdminSessionRepo;
