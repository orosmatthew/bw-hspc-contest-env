import { db } from '$lib/server/prisma';
import fs from 'fs-extra';
import { join } from 'path';
import simpleGit from 'simple-git';

export async function createRepos(contestId: number) {
	if (fs.existsSync('temp')) {
		fs.rmSync('temp', { recursive: true });
	}
	fs.mkdirSync('temp');
	const contest = await db.contest.findUnique({
		where: { id: contestId },
		include: { teams: true, problems: true }
	});
	if (!contest) {
		return;
	}
	contest.teams.forEach(async (team) => {
		fs.mkdirSync(join('temp', team.id.toString()));
		const git = simpleGit({ baseDir: join('temp', team.id.toString()) });
		await git.init();
		await git.checkoutLocalBranch('master');
		contest.problems.forEach((problem) => {
			fs.mkdirSync(join('temp', team.id.toString(), problem.pascalName));
			fs.writeFileSync(
				join('temp', team.id.toString(), problem.pascalName, problem.pascalName + '.java'),
				`public class ${problem.pascalName} {
    public static void main(String[] args) {
        System.out.println("Hello ${problem.pascalName}!");
    }
}`
			);
		});
		await git.add('.');
		await git.commit('Initial', { '--author': 'Admin <>' });
		await git.push(
			'http://localhost:7006/' + contest.id.toString() + '/' + team.id.toString(),
			'master'
		);
	});
}
