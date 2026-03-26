import { building } from '$app/environment';
import { AdminSessionRepo } from './admin-session-repo';
import { env } from '$env/dynamic/private';
import { ContestRepo } from './contest-repo';
import { TeamRepo } from './team-repo';
import { ProblemRepo } from './problem-repo';
import { ActiveTeamRepo } from './active-team-repo';
import { SubmissionRepo } from './submission-repo';

export const adminSessionRepo = (
	building
		? undefined
		: new AdminSessionRepo({
				adminUsername: env.ADMIN_USERNAME,
				adminPassword: env.ADMIN_PASSWORD,
				expiresMinutes: 60 * 24 // day
			})
) as AdminSessionRepo;

export const contestRepo = (building ? undefined : new ContestRepo()) as ContestRepo;

export const teamRepo = (building ? undefined : new TeamRepo()) as TeamRepo;

export const problemRepo = (building ? undefined : new ProblemRepo()) as ProblemRepo;

export const activeTeamRepo = (building ? undefined : new ActiveTeamRepo()) as ActiveTeamRepo;

export const submissionRepo = (building ? undefined : new SubmissionRepo()) as SubmissionRepo;
