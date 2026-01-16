ALTER TABLE "user" ADD COLUMN "active_plan" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" text;