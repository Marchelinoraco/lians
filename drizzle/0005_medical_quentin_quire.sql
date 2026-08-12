CREATE TYPE "public"."booking_source" AS ENUM('website', 'manual');--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" "booking_source" DEFAULT 'website' NOT NULL;