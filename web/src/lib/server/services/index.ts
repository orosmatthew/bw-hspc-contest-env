import { initRuntimeOnly } from '$lib/common/utils';
import { GitRepoService } from './git-repo-service';
import { GitServerService } from './git-server-service';
import { JobService } from './job-service';
import { ScoreboardService } from './scoreboard-service';

export const scoreboardService = initRuntimeOnly(() => new ScoreboardService());
export const jobService = initRuntimeOnly(() => new JobService());
export const gitRepoService = initRuntimeOnly(() => new GitRepoService());
export const gitServerService = initRuntimeOnly(() => new GitServerService());
