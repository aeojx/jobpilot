CREATE TABLE `api_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthKey` varchar(7) NOT NULL,
	`callCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_usage_monthKey_unique` UNIQUE(`monthKey`)
);
--> statement-breakpoint
CREATE TABLE `applier_gamification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applier_gamification_id` PRIMARY KEY(`id`),
	CONSTRAINT `applier_gamification_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `applier_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`appliedCount` int NOT NULL DEFAULT 0,
	`targetCount` int NOT NULL DEFAULT 10,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applier_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `applier_stats_dateKey_unique` UNIQUE(`dateKey`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255),
	`title` varchar(512) NOT NULL,
	`company` varchar(512) NOT NULL,
	`location` text,
	`description` text,
	`descriptionHtml` text,
	`applyUrl` text,
	`source` varchar(128),
	`matchScore` float DEFAULT 0,
	`status` enum('ingested','matched','to_apply','applied','rejected') NOT NULL DEFAULT 'ingested',
	`isDuplicate` boolean NOT NULL DEFAULT false,
	`hasEmail` boolean NOT NULL DEFAULT false,
	`emailFound` varchar(320),
	`tags` json DEFAULT ('[]'),
	`rawJson` json,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_bank` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`jobTitle` varchar(512),
	`jobCompany` varchar(512),
	`question` text NOT NULL,
	`answer` text,
	`askedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`answeredAt` timestamp,
	CONSTRAINT `question_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_profile_id` PRIMARY KEY(`id`)
);
