CREATE TABLE "ticket_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_code" text NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"airline" text,
	"departure_date" date NOT NULL,
	"return_date" date,
	"pax" integer NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"customer_id" uuid,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_requests_request_code_unique" UNIQUE("request_code")
);
--> statement-breakpoint
ALTER TABLE "ticket_requests" ADD CONSTRAINT "ticket_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;