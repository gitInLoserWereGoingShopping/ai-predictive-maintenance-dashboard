CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`location` text,
	`manufacturer` text,
	`model` text,
	`installation_date` text,
	`last_maintenance_date` text,
	`file_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `uploaded_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `data_quality_issues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_id` text NOT NULL,
	`asset_id` text,
	`timestamp` text,
	`issue_type` text NOT NULL,
	`field` text,
	`value` text,
	`severity` text NOT NULL,
	`detected_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `uploaded_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` text NOT NULL,
	`window_end` text NOT NULL,
	`temp_mean_24h` real,
	`temp_std_24h` real,
	`temp_max_24h` real,
	`temp_min_24h` real,
	`pressure_mean_24h` real,
	`pressure_std_24h` real,
	`pressure_max_24h` real,
	`pressure_min_24h` real,
	`vibration_mean_24h` real,
	`vibration_std_24h` real,
	`vibration_max_24h` real,
	`vibration_min_24h` real,
	`temp_lag_1h` real,
	`pressure_lag_1h` real,
	`vibration_lag_1h` real,
	`temp_roc_24h` real,
	`pressure_roc_24h` real,
	`vibration_roc_24h` real,
	`failure_flag` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version` text NOT NULL,
	`model_type` text NOT NULL,
	`training_samples` integer NOT NULL,
	`validation_samples` integer NOT NULL,
	`metrics` text NOT NULL,
	`feature_importances` text NOT NULL,
	`model_path` text,
	`trained_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_version_unique` ON `models` (`version`);--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` text NOT NULL,
	`probability` real NOT NULL,
	`risk_level` text NOT NULL,
	`recommendation` text NOT NULL,
	`model_version` text,
	`feature_importances` text,
	`predicted_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`temp_f` real NOT NULL,
	`pressure_psi` real NOT NULL,
	`vibration_mm` real NOT NULL,
	`failure_flag` integer DEFAULT 0 NOT NULL,
	`file_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `uploaded_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`row_count` integer NOT NULL,
	`asset_count` integer NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL
);
