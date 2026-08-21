CREATE TABLE "fleet_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate" text NOT NULL,
	"vehicle_id" uuid,
	"vehicle_name_snapshot" text NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fleet_units_plate_vehicle" UNIQUE("plate","vehicle_id")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "fleet_unit_id" uuid;--> statement-breakpoint
ALTER TABLE "fleet_units" ADD CONSTRAINT "fleet_units_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;