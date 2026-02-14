CREATE TABLE `ads` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`image_url` text NOT NULL,
	`placement` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`duration` integer NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USDC',
	`status` text DEFAULT 'pending_payment',
	`transaction_signature` text,
	`advertiser_wallet` text NOT NULL,
	`email` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP
);
