CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`needed` integer NOT NULL,
	`body` text NOT NULL,
	`url` text NOT NULL,
	`letter` text NOT NULL,
	`day` text NOT NULL,
	`created` text NOT NULL
);
