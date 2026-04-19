ALTER TABLE `fetch_schedules` ADD `weekdaysOnly` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `fetch_schedules` ADD `queryRotation` json;