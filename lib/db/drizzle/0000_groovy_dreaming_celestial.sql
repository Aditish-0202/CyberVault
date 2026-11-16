CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'analyst' NOT NULL,
	"department" text,
	"phone" text,
	"location" text,
	"bio" text,
	"avatar_url" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ip_address" text NOT NULL,
	"type" text NOT NULL,
	"os" text,
	"status" text DEFAULT 'online' NOT NULL,
	"cpu_usage" real DEFAULT 0 NOT NULL,
	"memory_usage" real DEFAULT 0 NOT NULL,
	"disk_usage" real DEFAULT 0 NOT NULL,
	"location" text,
	"assigned_user" text,
	"risk_score" real DEFAULT 0 NOT NULL,
	"open_alerts" integer DEFAULT 0 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"source" text NOT NULL,
	"source_ip" text,
	"target_ip" text,
	"device_id" integer,
	"device_name" text,
	"attack_type" text,
	"mitre_tactic" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"source_ip" text,
	"user_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"user_id" integer,
	"user_name" text,
	"resource_type" text,
	"resource_id" integer,
	"severity" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"severity" text,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"critical_alert_email" boolean DEFAULT true NOT NULL,
	"weekly_report" boolean DEFAULT false NOT NULL,
	"session_timeout" integer DEFAULT 30 NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"api_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_user_id_unique" UNIQUE("user_id")
);
