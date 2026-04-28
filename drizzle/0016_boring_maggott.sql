ALTER TABLE `resume_generation_log` ADD `promptTokens` int;--> statement-breakpoint
ALTER TABLE `resume_generation_log` ADD `completionTokens` int;--> statement-breakpoint
ALTER TABLE `resume_generation_log` ADD `totalTokens` int;--> statement-breakpoint
ALTER TABLE `resume_generation_log` ADD `creditCost` float;