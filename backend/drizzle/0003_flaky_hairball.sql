CREATE TABLE IF NOT EXISTS `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_token` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`institution` varchar(255) NOT NULL,
	`ukkj` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attempt_id` int NOT NULL,
	`question_id` int NOT NULL,
	`question_type` enum('single_choice','multiple_response','multiple_choice','true_false') NOT NULL,
	`selected_keys_json` text NOT NULL,
	`is_correct` boolean,
	`score` int,
	`max_score` int,
	`elapsed_seconds` int NOT NULL DEFAULT 0,
	`answered_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `quiz_answers_attempt_id_question_id_unique` UNIQUE(`attempt_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participant_id` int NOT NULL,
	`topic_id` int NOT NULL,
	`status` enum('in_progress','finished','abandoned') NOT NULL DEFAULT 'in_progress',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`finished_at` timestamp,
	`total_questions` int NOT NULL DEFAULT 0,
	`answered_questions` int NOT NULL DEFAULT 0,
	`total_correct` int NOT NULL DEFAULT 0,
	`total_incorrect` int NOT NULL DEFAULT 0,
	`total_score` int NOT NULL DEFAULT 0,
	`max_score` int NOT NULL DEFAULT 0,
	`total_elapsed_seconds` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_attempt_id_quiz_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_participant_id_participants_id_fk` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_topic_id_topics_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE no action ON UPDATE no action;
