CREATE TABLE `resume_generation_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`jobTitle` varchar(512),
	`jobCompany` varchar(512),
	`requestedBy` varchar(255) NOT NULL,
	`requestedByUserId` int,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`filePath` varchar(512),
	`fileUrl` text,
	`errorMessage` text,
	`durationMs` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `resume_generation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `resumeGeneratedPath` varchar(512);