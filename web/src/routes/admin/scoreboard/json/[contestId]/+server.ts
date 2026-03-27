import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scoreboardData } from '$lib/server/scoreboard-data';
import z from 'zod';
import { contestRepo } from '$lib/server/repos';

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

export const GET = (async ({ params }) => {
	const contestIdParse = z.coerce.number().int().safeParse(params.contestId);
	if (!contestIdParse.success) {
		error(400, { message: 'Invalid contest id' });
	}
	const contest = await contestRepo.getById(contestIdParse.data);
	if (contest === undefined) {
		error(404, 'Contest not found');
	}
	const data = scoreboardData(contest);
	const problems = data.contest.problems.map((p) => p.friendlyName);
	const problemIds = data.contest.problems.map((p) => p.id);
	const exportData: ScoreboardExportSchema = {
		problems: problems,
		teams: data.contest.teams.map((t) => {
			return {
				correct: t.solves,
				name: t.name,
				points: parseFloat(t.time.toFixed(2)),
				problems: t.problems
					.sort((a, b) => problemIds.indexOf(a.id) - problemIds.indexOf(b.id))
					.map((p) => {
						return {
							attempts: p.attempts !== 0 ? p.attempts : null,
							time: p.min !== undefined ? parseFloat(p.min.toFixed(2)) : null
						};
					})
			};
		})
	};
	return json(exportData);
}) satisfies RequestHandler;
