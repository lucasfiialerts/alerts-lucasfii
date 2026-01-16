CREATE TABLE "fii_fund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fii_fund_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
CREATE TABLE "fii_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"report_date" timestamp NOT NULL,
	"report_month" text NOT NULL,
	"report_url" text,
	"download_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_fii_follow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"fund_id" uuid NOT NULL,
	"notifications_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fii_report" ADD CONSTRAINT "fii_report_fund_id_fii_fund_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."fii_fund"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fii_follow" ADD CONSTRAINT "user_fii_follow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fii_follow" ADD CONSTRAINT "user_fii_follow_fund_id_fii_fund_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."fii_fund"("id") ON DELETE cascade ON UPDATE no action;