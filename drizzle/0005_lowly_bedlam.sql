CREATE TABLE `swipe_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`approved` int NOT NULL DEFAULT 0,
	`rejected` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `swipe_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `swipe_stats_dateKey_unique` UNIQUE(`dateKey`)
);
