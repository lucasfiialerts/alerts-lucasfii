CREATE TABLE "fii_alert_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fund_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"message" text NOT NULL,
	"price" text NOT NULL,
	"variation" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE "fii_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"price" text NOT NULL,
	"variation" text,
	"volume" text,
	"market_cap" text,
	"dividend_yield" text,
	"record_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_fii_follow" ADD COLUMN "price_alert_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_fii_follow" ADD COLUMN "min_variation_percent" text DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "user_fii_follow" ADD COLUMN "alert_frequency" text DEFAULT 'daily';--> statement-breakpoint
ALTER TABLE "fii_alert_log" ADD CONSTRAINT "fii_alert_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fii_alert_log" ADD CONSTRAINT "fii_alert_log_fund_id_fii_fund_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."fii_fund"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fii_price_history" ADD CONSTRAINT "fii_price_history_fund_id_fii_fund_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."fii_fund"("id") ON DELETE cascade ON UPDATE no action;