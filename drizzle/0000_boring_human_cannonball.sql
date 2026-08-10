CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'electric', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."rate_type" AS ENUM('24h', '12h');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('self-drive', 'with-driver', 'tourism', 'travel');--> statement-breakpoint
CREATE TYPE "public"."transmission" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('hatchback', 'sedan', 'suv', 'mpv', 'luxury', 'bus');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('available', 'unavailable');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_code" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"service_type" "service_type" NOT NULL,
	"vehicle_id" uuid,
	"route_id" uuid,
	"vehicle_name_snapshot" text,
	"route_name_snapshot" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"rate_type" "rate_type",
	"driver_days" integer DEFAULT 0 NOT NULL,
	"total_price" integer,
	"price_breakdown" jsonb,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"rating" integer NOT NULL,
	"review_text" jsonb NOT NULL,
	"vehicle_name" text,
	"date" date NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"price" integer,
	"vehicle_note" jsonb,
	"estimated_duration" jsonb,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "vehicle_category" NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_24h" integer NOT NULL,
	"rate_12h" integer,
	"driver_fee_override" integer,
	"service_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seats" integer NOT NULL,
	"transmission" "transmission" NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"year" integer NOT NULL,
	"luggage" integer DEFAULT 0 NOT NULL,
	"features" jsonb DEFAULT '{"id":[]}'::jsonb NOT NULL,
	"rental_terms" jsonb DEFAULT '{"id":[]}'::jsonb NOT NULL,
	"status" "vehicle_status" DEFAULT 'available' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_route_id_travel_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."travel_routes"("id") ON DELETE set null ON UPDATE no action;