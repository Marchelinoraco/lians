CREATE TABLE "tour_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_code" text NOT NULL,
	"tour_slug" text NOT NULL,
	"tour_name_snapshot" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"customer_id" uuid,
	"pax" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tour_requests_request_code_unique" UNIQUE("request_code")
);
--> statement-breakpoint
ALTER TABLE "tour_requests" ADD CONSTRAINT "tour_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;