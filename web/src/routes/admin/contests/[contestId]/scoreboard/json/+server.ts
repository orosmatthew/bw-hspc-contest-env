import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import z from 'zod';
import { scoreboardService } from '$lib/server/services';

type ScoreboardExportSchema = {
	problems: Array<string>;
	teams: Array<{
		correct: number;
		name: string;
		points: number;
		problems: Array<{
			attempts: number | null;
			time: number | null;
		}>;
	}>;
};

export const GET: RequestHandler = async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	if (!contestIdParse.success) {
		error(400, { message: 'Invalid contest id' });
	}
	const scoreboard = await scoreboardService.getForContest(contestIdParse.data);
	if (scoreboard === undefined) {
		error(500, { message: 'Unable to create scoreboard data' });
	}
	const problemIds = scoreboard.contest.problems.map((p) => p.id);
	const exportData: ScoreboardExportSchema = {
		problems: scoreboard.contest.problems.map((p) => p.friendlyName),
		teams: scoreboard.contest.teams.map((t) => ({
			correct: t.solves,
			name: t.name,
			points: parseFloat(t.time.toFixed(2)),
			problems: t.problems
				.sort((a, b) => problemIds.indexOf(a.id) - problemIds.indexOf(b.id))
				.map((p) => ({
					attempts: p.attempts !== 0 ? p.attempts : null,
					time: p.min !== undefined ? parseFloat(p.min.toFixed(2)) : null
				}))
		}))
	};
	return json(exportData);
};
