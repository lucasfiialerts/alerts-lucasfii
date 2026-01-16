ALTER TABLE "user_fii_follow" ALTER COLUMN "min_variation_percent" SET DEFAULT '0.1';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_reports" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_market_close" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_treasury" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_auto_update" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_variation" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_yield" boolean DEFAULT false;