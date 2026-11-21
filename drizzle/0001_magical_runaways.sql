ALTER TABLE `offers` ADD `salary` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `revision` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `file_key` text;