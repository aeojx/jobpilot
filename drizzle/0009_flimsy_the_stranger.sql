ALTER TABLE `jobs` ADD `manuallyAdded` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `addedBy` varchar(255);