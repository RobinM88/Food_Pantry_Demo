-- Drop existing tables if they exist
DROP TABLE IF EXISTS "PhoneLog" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "ConnectedFamily" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS member_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS delivery_type CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS call_type CASCADE;
DROP TYPE IF EXISTS call_outcome CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;

-- Create enum types
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending', 'suspended', 'banned', 'denied');
CREATE TYPE order_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'confirmed',
    'ready',
    'picked_up',
    'completed',
    'cancelled',
    'no_show',
    'out_for_delivery',
    'delivered',
    'failed_delivery'
);
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE call_type AS ENUM ('incoming', 'outgoing');
CREATE TYPE call_outcome AS ENUM ('successful', 'voicemail', 'no_answer', 'wrong_number', 'disconnected');
CREATE TYPE relationship_type AS ENUM ('parent', 'child', 'spouse', 'sibling', 'other');

-- Create Client table
CREATE TABLE "Client" (
    "id" TEXT PRIMARY KEY,
    "family_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT DEFAULT NULL,
    "address" TEXT NOT NULL,
    "apt_number" TEXT DEFAULT NULL,
    "zip_code" TEXT NOT NULL,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT DEFAULT NULL,
    "is_unhoused" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_temporary" BOOLEAN NOT NULL DEFAULT FALSE,
    "member_status" member_status NOT NULL DEFAULT 'pending',
    "family_size" INTEGER NOT NULL DEFAULT 1,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "school_aged" INTEGER NOT NULL DEFAULT 0,
    "small_children" INTEGER NOT NULL DEFAULT 0,
    "temporary_members" JSONB DEFAULT NULL,
    "food_notes" TEXT DEFAULT NULL,
    "office_notes" TEXT DEFAULT NULL,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "total_this_month" INTEGER NOT NULL DEFAULT 0,
    "last_visit" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Add constraint to validate temporary_members structure
    CONSTRAINT check_temporary_members_structure CHECK (
        temporary_members IS NULL OR (
            jsonb_typeof(temporary_members) = 'object' AND
            jsonb_typeof(temporary_members->'adults') = 'number' AND
            jsonb_typeof(temporary_members->'school_aged') = 'number' AND
            jsonb_typeof(temporary_members->'small_children') = 'number'
        )
    )
);

-- Create ConnectedFamily table
CREATE TABLE "ConnectedFamily" (
    "id" TEXT PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "connected_to" TEXT NOT NULL,
    "relationship_type" relationship_type NOT NULL,
    FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE,
    FOREIGN KEY ("connected_to") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Create Order table
CREATE TABLE "Order" (
    "id" TEXT PRIMARY KEY,
    "family_search_id" TEXT NOT NULL,
    "status" order_status NOT NULL DEFAULT 'pending',
    "pickup_date" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "notes" TEXT DEFAULT NULL,
    "delivery_type" delivery_type NOT NULL DEFAULT 'pickup',
    "is_new_client" BOOLEAN NOT NULL DEFAULT FALSE,
    "approval_status" approval_status NOT NULL DEFAULT 'pending',
    "number_of_boxes" INTEGER NOT NULL DEFAULT 1,
    "additional_people" JSONB NOT NULL DEFAULT '{"adults": 0, "school_aged": 0, "small_children": 0}'::jsonb,
    "visit_contact" TEXT DEFAULT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("family_search_id") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Create PhoneLog table
CREATE TABLE "PhoneLog" (
    "id" TEXT PRIMARY KEY,
    "family_search_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "call_type" call_type NOT NULL,
    "call_outcome" call_outcome NOT NULL,
    "notes" TEXT DEFAULT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("family_search_id") REFERENCES "Client"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "idx_client_family_number" ON "Client"("family_number");
CREATE INDEX "idx_client_phone1" ON "Client"("phone1");
CREATE INDEX "idx_client_phone2" ON "Client"("phone2");
CREATE INDEX "idx_order_family_search_id" ON "Order"("family_search_id");
CREATE INDEX "idx_phone_log_family_search_id" ON "PhoneLog"("family_search_id");
CREATE INDEX "idx_connected_family_client_id" ON "ConnectedFamily"("client_id");
CREATE INDEX "idx_connected_family_connected_to" ON "ConnectedFamily"("connected_to");

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_client_updated_at
    BEFORE UPDATE ON "Client"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_updated_at
    BEFORE UPDATE ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_log_updated_at
    BEFORE UPDATE ON "PhoneLog"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_family_updated_at
    BEFORE UPDATE ON "ConnectedFamily"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 