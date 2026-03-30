import { initRuntimeOnly } from '$lib/common/utils';
import { JobService } from './job-service';
import { ScoreboardService } from './scoreboard-service';

export const scoreboardService = initRuntimeOnly(() => new ScoreboardService());
export const jobService = initRuntimeOnly(() => new JobService());
