import {
	submissionStateReasonValues,
	submissionStateValues
} from 'bwcontest-shared/types/submission';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const adminSessionTable = sqliteTable(
	'admin_session',
	{
		token: text('token').notNull().primaryKey(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [index('admin_session_created_at_idx').on(table.createdAt)]
);

export const problemTable = sqliteTable('problem', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	friendlyName: text('friendly_name').notNull().unique(),
	pascalName: text('pascal_name').notNull().unique(),
	sampleInput: text('sample_input').notNull(),
	sampleOutput: text('sample_output').notNull(),
	realInput: text('real_input').notNull(),
	realOutput: text('real_output').notNull(),
	inputSpec: text('input_spec')
});

export const contestTable = sqliteTable('contest', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	startTime: integer('start_time', { mode: 'timestamp' }),
	freezeTime: integer('freeze_time', { mode: 'timestamp' })
});

export const teamTable = sqliteTable('team', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	password: text('password').notNull(),
	language: text('language', { enum: ['java', 'csharp', 'cpp', 'python'] }).notNull()
});

export const activeTeamTable = sqliteTable(
	'active_team',
	{
		id: integer('id').notNull().primaryKey({ autoIncrement: true }),
		teamId: integer('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'restrict' })
			.unique(),
		sessionToken: text('session_token').unique(),
		sessionCreatedAt: integer('session_created_at', { mode: 'timestamp' }),
		contestId: integer('contest_id')
			.notNull()
			.references(() => contestTable.id, { onDelete: 'restrict' })
	},
	(table) => [index('active_team_contest_id_idx').on(table.contestId)]
);

export const submissionTable = sqliteTable(
	'submission',
	{
		id: integer('id').notNull().primaryKey({ autoIncrement: true }),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		gradedAt: integer('graded_at', { mode: 'timestamp' }),
		state: text('state', { enum: submissionStateValues }).notNull(),
		stateReason: text('state_reason', {
			enum: submissionStateReasonValues
		}),
		stateReasonDetails: text('state_reason_details'),
		actualOutput: text('actual_output'),
		testCaseResults: text('test_case_results'),
		exitCode: integer('exit_code'),
		runtimeMilliseconds: integer('runtime_milliseconds'),
		commitHash: text('commit_hash').notNull(),
		diff: text('diff'),
		message: text('message'),
		teamId: integer('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'restrict' }),
		problemId: integer('problem_id')
			.notNull()
			.references(() => problemTable.id, { onDelete: 'restrict' }),
		contestId: integer('contest_id')
			.notNull()
			.references(() => contestTable.id, { onDelete: 'cascade' })
	},
	(table) => [
		index('submission_state_created_at_idx').on(table.state, table.createdAt),
		index('submission_contest_team_problem_idx').on(table.contestId, table.teamId, table.problemId),
		index('submission_team_id_idx').on(table.teamId),
		index('submission_problem_id_idx').on(table.problemId)
	]
);

export const submissionSourceFileTable = sqliteTable(
	'submission_source_file',
	{
		id: integer('id').notNull().primaryKey({ autoIncrement: true }),
		submissionId: integer('submission_id')
			.notNull()
			.references(() => submissionTable.id, { onDelete: 'cascade' }),
		pathFromProblemRoot: text('path_from_problem_root').notNull(),
		content: text('content').notNull()
	},
	(table) => [index('submission_source_file_submission_id_idx').on(table.submissionId)]
);

export const contestProblemTable = sqliteTable(
	'contest_problem',
	{
		contestId: integer('contest_id')
			.notNull()
			.references(() => contestTable.id, { onDelete: 'cascade' }),
		problemId: integer('problem_id')
			.notNull()
			.references(() => problemTable.id, { onDelete: 'restrict' })
	},
	(table) => [
		primaryKey({ columns: [table.contestId, table.problemId] }),
		index('contest_problem_problem_id_idx').on(table.problemId)
	]
);

export const contestTeamTable = sqliteTable(
	'contest_team',
	{
		contestId: integer('contest_id')
			.notNull()
			.references(() => contestTable.id, { onDelete: 'cascade' }),
		teamId: integer('team_id')
			.notNull()
			.references(() => teamTable.id, { onDelete: 'restrict' })
	},
	(table) => [
		primaryKey({ columns: [table.contestId, table.teamId] }),
		index('contest_team_team_id_idx').on(table.teamId)
	]
);
