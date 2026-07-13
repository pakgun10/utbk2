ALTER TABLE `questions` MODIFY COLUMN `type` enum('single_choice','multiple_response','multiple_choice','true_false') NOT NULL;--> statement-breakpoint
ALTER TABLE `question_options` ADD `score` int;