CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_at` integer DEFAULT CURRENT_TIMESTAMP,
	`uploaded_by` text NOT NULL,
	`gridFSFileId` text NOT NULL,
	`is_deleted` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `mods` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_address` text NOT NULL,
	`added_by` text NOT NULL,
	`added_at` integer DEFAULT CURRENT_TIMESTAMP,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mods_wallet_address_unique` ON `mods` (`wallet_address`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`content` text,
	`image_file_id` text,
	`video_file_id` text,
	`author_id` text,
	`is_anonymous` integer DEFAULT true,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP,
	`saged` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `thread_tags` (
	`thread_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`thread_id`, `tag_id`)
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`ipns_link` text,
	`op_post_id` text NOT NULL,
	`author_id` text,
	`reply_count` integer DEFAULT 0,
	`image_count` integer DEFAULT 0,
	`video_count` integer DEFAULT 0,
	`last_activity` integer DEFAULT CURRENT_TIMESTAMP,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`archived` integer DEFAULT false,
	`archived_at` integer,
	`saged` integer DEFAULT false,
	`sage_count` integer DEFAULT 0,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `threads_slug_unique` ON `threads` (`slug`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_address` text NOT NULL,
	`username` text,
	`location` text,
	`bio` text,
	`x_link` text,
	`youtube_link` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_wallet_address_unique` ON `user_profiles` (`wallet_address`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text DEFAULT 'Anonymous',
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);