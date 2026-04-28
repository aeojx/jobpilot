ALTER TABLE `jobs` ADD `scoreSkills` float;--> statement-breakpoint
ALTER TABLE `jobs` ADD `scoreSeniority` float;--> statement-breakpoint
ALTER TABLE `jobs` ADD `scoreLocation` float;--> statement-breakpoint
ALTER TABLE `jobs` ADD `scoreIndustry` float;--> statement-breakpoint
ALTER TABLE `jobs` ADD `scoreCompensation` float;--> statement-breakpoint
ALTER TABLE `jobs` ADD `dealBreakerMatched` varchar(512);--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `mustHaveSkills` json;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `niceToHaveSkills` json;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `dealbreakers` json;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `seniority` varchar(64);--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `salaryMin` int;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `targetIndustries` json;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `remotePreference` enum('remote','hybrid','onsite','any') DEFAULT 'any';--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `weightSkills` int DEFAULT 40;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `weightSeniority` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `weightLocation` int DEFAULT 20;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `weightIndustry` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `skills_profile` ADD `weightCompensation` int DEFAULT 10;