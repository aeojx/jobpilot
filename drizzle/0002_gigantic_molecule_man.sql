CREATE TABLE `fetch_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int,
	`scheduleName` varchar(255),
	`endpoint` varchar(64) NOT NULL,
	`filters` json,
	`jobsFetched` int NOT NULL DEFAULT 0,
	`jobsIngested` int NOT NULL DEFAULT 0,
	`jobsDuplicate` int NOT NULL DEFAULT 0,
	`jobsRemaining` int,
	`requestsRemaining` int,
	`status` enum('success','error','partial') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`ranAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fetch_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fetch_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`endpoint` enum('active-ats-7d','active-ats-24h') NOT NULL DEFAULT 'active-ats-7d',
	`filters` json NOT NULL,
	`intervalType` enum('manual','daily','weekly') NOT NULL DEFAULT 'manual',
	`scheduleHour` int DEFAULT 9,
	`scheduleMinute` int DEFAULT 0,
	`scheduleDayOfWeek` int,
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fetch_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `api_usage` ADD `jobsLimit` int;--> statement-breakpoint
ALTER TABLE `api_usage` ADD `jobsRemaining` int;--> statement-breakpoint
ALTER TABLE `api_usage` ADD `requestsLimit` int;--> statement-breakpoint
ALTER TABLE `api_usage` ADD `requestsRemaining` int;--> statement-breakpoint
ALTER TABLE `api_usage` ADD `quotaResetSeconds` int;