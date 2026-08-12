CREATE TYPE "public"."rate_category" AS ENUM('lepas-kunci', 'pelayanan');--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "rate_24h" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "rate_category" "rate_category";--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "rate_lepas_kunci" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "rate_pelayanan" integer;