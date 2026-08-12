CREATE TABLE "supplier_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "supplier_vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "supplier_name_snapshot" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "supplier_cost" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "supplier_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "supplier_vehicles" ADD CONSTRAINT "supplier_vehicles_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_supplier_vehicle_id_supplier_vehicles_id_fk" FOREIGN KEY ("supplier_vehicle_id") REFERENCES "public"."supplier_vehicles"("id") ON DELETE set null ON UPDATE no action;