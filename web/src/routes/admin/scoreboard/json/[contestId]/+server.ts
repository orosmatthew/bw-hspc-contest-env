import { scoreboardData } from '$lib/server/scoreboardData';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/prisma';

type ScoreboardExportSchema = {
	version: 3;
	problems: string[];
	teams: {
		correct: number;
		name: string;
		points: number;
		problems: {
			attempts: number | null;
			time: number | null;
		}[];
	}[];
};

export const GET = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw error(400, 'Invalid contest id');
	}
	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { problems: true, teams: { include: { submissions: true } } }
	});
	if (contest === null) {
		throw error(304, 'Contest not found');
	}
	const data = scoreboardData(contest);
	const problems = data.contest.problems.map((p) => p.friendlyName);
	const problemIds = data.contest.problems.map((p) => p.id);
	const exportData: ScoreboardExportSchema = {
		version: 3,
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

/**
 * type ScoreboardDataType = {
	timestamp: Date;
	frozen: boolean;
	contest: {
		id: number;
		name: string;
		problems: { id: number; friendlyName: string }[];
		teams: {
			id: number;
			name: string;
			solves: number;
			time: number;
			problems: { id: number; attempts: number; graphic: string | null; min: number | undefined }[];
		}[];
	};
};
 * 
 */
