DROP INDEX "mods_wallet_address_unique";--> statement-breakpoint
DROP INDEX "tags_name_unique";--> statement-breakpoint
DROP INDEX "tags_slug_unique";--> statement-breakpoint
DROP INDEX "threads_slug_unique";--> statement-breakpoint
DROP INDEX "user_profiles_wallet_address_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `threads` ALTER COLUMN "op_post_id" TO "op_post_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX `mods_wallet_address_unique` ON `mods` (`wallet_address`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `threads_slug_unique` ON `threads` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_wallet_address_unique` ON `user_profiles` (`wallet_address`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);