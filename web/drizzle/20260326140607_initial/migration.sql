CREATE TABLE `active_team` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`team_id` integer NOT NULL,
	`session_token` text UNIQUE,
	`session_created_at` integer,
	`contest_id` integer NOT NULL,
	CONSTRAINT `fk_active_team_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_active_team_contest_id_contest_id_fk` FOREIGN KEY (`contest_id`) REFERENCES `contest`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `admin_session` (
	`token` text PRIMARY KEY,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contest_problem` (
	`contest_id` integer NOT NULL,
	`problem_id` integer NOT NULL,
	CONSTRAINT `contest_problem_pk` PRIMARY KEY(`contest_id`, `problem_id`),
	CONSTRAINT `fk_contest_problem_contest_id_contest_id_fk` FOREIGN KEY (`contest_id`) REFERENCES `contest`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_contest_problem_problem_id_problem_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `contest` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`start_time` integer,
	`freeze_time` integer
);
--> statement-breakpoint
CREATE TABLE `contest_team` (
	`contest_id` integer NOT NULL,
	`team_id` integer NOT NULL,
	CONSTRAINT `contest_team_pk` PRIMARY KEY(`contest_id`, `team_id`),
	CONSTRAINT `fk_contest_team_contest_id_contest_id_fk` FOREIGN KEY (`contest_id`) REFERENCES `contest`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_contest_team_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `problem` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`friendly_name` text NOT NULL UNIQUE,
	`pascal_name` text NOT NULL UNIQUE,
	`sample_input` text NOT NULL,
	`sample_output` text NOT NULL,
	`real_input` text NOT NULL,
	`real_output` text NOT NULL,
	`input_spec` text
);
--> statement-breakpoint
CREATE TABLE `submission_source_file` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`submission_id` integer NOT NULL,
	`path_from_problem_root` text NOT NULL,
	`content` text NOT NULL,
	CONSTRAINT `fk_submission_source_file_submission_id_submission_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `submission` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` integer NOT NULL,
	`graded_at` integer,
	`state` text NOT NULL,
	`state_reason` text,
	`state_reason_details` text,
	`actual_output` text,
	`test_case_results` text,
	`exit_code` integer,
	`runtime_milliseconds` integer,
	`commit_hash` text NOT NULL,
	`diff` text,
	`message` text,
	`team_id` integer NOT NULL,
	`problem_id` integer NOT NULL,
	`contest_id` integer NOT NULL,
	CONSTRAINT `fk_submission_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_submission_problem_id_problem_id_fk` FOREIGN KEY (`problem_id`) REFERENCES `problem`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_submission_contest_id_contest_id_fk` FOREIGN KEY (`contest_id`) REFERENCES `contest`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`password` text NOT NULL,
	`language` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_active_team_team_id` ON `active_team` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_active_team_contest_id` ON `active_team` (`contest_id`);--> statement-breakpoint
CREATE INDEX `idx_contest_problem_contest_id` ON `contest_problem` (`contest_id`);--> statement-breakpoint
CREATE INDEX `idx_contest_problem_problem_id` ON `contest_problem` (`problem_id`);--> statement-breakpoint
CREATE INDEX `idx_contest_team_contest_id` ON `contest_team` (`contest_id`);--> statement-breakpoint
CREATE INDEX `idx_contest_team_team_id` ON `contest_team` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_submission_source_file_submission_id` ON `submission_source_file` (`submission_id`);--> statement-breakpoint
CREATE INDEX `idx_submission_team_id` ON `submission` (`team_id`);--> statement-breakpoint
CREATE INDEX `idx_submission_problem_id` ON `submission` (`problem_id`);--> statement-breakpoint
CREATE INDEX `idx_submission_contest_id` ON `submission` (`contest_id`);