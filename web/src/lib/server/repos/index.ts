import { AdminSessionRepo } from './admin-session-repo';
import { env } from '$env/dynamic/private';
import { ContestRepo } from './contest-repo';
import { TeamRepo } from './team-repo';
import { ProblemRepo } from './problem-repo';
import { ActiveTeamRepo } from './active-team-repo';
import { SubmissionRepo } from './submission-repo';
import { SubmissionSourceFileRepo } from './submission-source-file-repo';
import { initRuntimeOnly } from '$lib/common/utils';

export const adminSessionRepo = initRuntimeOnly(
	() =>
		new AdminSessionRepo({
			adminUsername: env.ADMIN_USERNAME,
			adminPassword: env.ADMIN_PASSWORD,
			expiresMinutes: 60 * 24 // day
		})
);
export const contestRepo = initRuntimeOnly(() => new ContestRepo());
export const teamRepo = initRuntimeOnly(() => new TeamRepo());
export const problemRepo = initRuntimeOnly(() => new ProblemRepo());
export const activeTeamRepo = initRuntimeOnly(() => new ActiveTeamRepo());
export const submissionRepo = initRuntimeOnly(() => new SubmissionRepo());
export const submissionSourceFileRepo = initRuntimeOnly(() => new SubmissionSourceFileRepo());
