import { db } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	const contestId = parseInt(params.contestId);
	if (isNaN(contestId)) {
		throw error(400, 'Invalid request');
	}

	const problemId = parseInt(params.problemId);
	if (isNaN(problemId)) {
		throw error(400, 'Invalid request');
	}

	const teamId = parseInt(params.teamId);
	if (isNaN(teamId)) {
		throw error(400, 'Invalid request');
	}

	const contest = await db.contest.findUnique({ where: { id: contestId } });
	if (!contest) {
		throw error(400, 'Contest not found');
	}

	const problem = await db.problem.findUnique({ where: { id: problemId } });
	if (!problem) {
		throw error(400, 'Problem not found');
	}

	const team = await db.team.findUnique({ where: { id: teamId } });
	if (!team) {
		throw error(400, 'Team not found');
	}

	const submissions = await db.submission.findMany({
		where: {
			contestId: contestId,
			problemId: problemId,
			teamId: teamId
		},
		include: {
			sourceFiles: true
		},
		orderBy: {
			createdAt: 'asc'
		}
	});

	if (submissions.length > 0) {
		const lastSubmission = submissions[submissions.length - 1];
		return redirect(302, `/admin/submissions/${lastSubmission.id}`);
	}

	throw error(400, 'No submissions found for arguments');
}) satisfies PageServerLoad;
