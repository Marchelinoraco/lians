ALTER TABLE "bookings" ADD COLUMN "cost_fuel" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cost_driver" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cost_toll_parking" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cost_other" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cost_other_note" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "price_edited_at" timestamp with time zone;