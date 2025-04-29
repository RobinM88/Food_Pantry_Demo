-- Add visit_contact column to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "visit_contact" TEXT DEFAULT NULL; 