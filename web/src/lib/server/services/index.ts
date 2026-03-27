import { initRuntimeOnly } from '$lib/common/utils';
import { ScoreboardService } from './scoreboard-service';

export const scoreboardService = initRuntimeOnly(() => new ScoreboardService());
