CREATE TABLE "dividend_alert_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"dividend_id" uuid NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'sent',
	"whatsapp_message_id" text
);
--> statement-breakpoint
CREATE TABLE "fii_dividend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" text NOT NULL,
	"asset_issued" text NOT NULL,
	"payment_date" timestamp NOT NULL,
	"rate" text NOT NULL,
	"related_to" text NOT NULL,
	"label" text NOT NULL,
	"last_date_prior" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alert_key" text NOT NULL,
	"alert_type" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_bitcoin" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_status_invest" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alert_preferences_on_demand_quote" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "dividend_alert_log" ADD CONSTRAINT "dividend_alert_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividend_alert_log" ADD CONSTRAINT "dividend_alert_log_dividend_id_fii_dividend_id_fk" FOREIGN KEY ("dividend_id") REFERENCES "public"."fii_dividend"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_alert" ADD CONSTRAINT "sent_alert_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;