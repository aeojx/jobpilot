ALTER TABLE `jobs` MODIFY COLUMN `status` enum('ingested','matched','to_apply','applied','rejected','expired') NOT NULL DEFAULT 'ingested';--> statement-breakpoint
ALTER TABLE `jobs` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `fetch_history` ADD `durationMs` int;