CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_token` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`institution` varchar(255) NOT NULL,
	`ukkj` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_session_token_unique` UNIQUE(`session_token`)
);
