-- First, drop the visit_contact column if it exists (to ensure clean recreation)
ALTER TABLE "Order" DROP COLUMN IF EXISTS "visit_contact";

-- Add the visit_contact column properly
ALTER TABLE "Order" ADD COLUMN "visit_contact" TEXT DEFAULT NULL;

-- Ensure id is properly set up as a UUID
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Add a trigger to ensure id is always set
CREATE OR REPLACE FUNCTION ensure_order_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_order_id_trigger ON "Order";
CREATE TRIGGER ensure_order_id_trigger
    BEFORE INSERT ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION ensure_order_id(); 