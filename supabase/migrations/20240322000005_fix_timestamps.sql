-- Create the function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_order_updated_at ON "Order";
DROP TRIGGER IF EXISTS ensure_order_id_trigger ON "Order";

-- Create a new function that handles both id and timestamps
CREATE OR REPLACE FUNCTION handle_order_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure id is set
    IF NEW.id IS NULL THEN
        NEW.id := gen_random_uuid();
    END IF;
    
    -- Ensure timestamps are set
    IF NEW.created_at IS NULL THEN
        NEW.created_at := CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.updated_at IS NULL THEN
        NEW.updated_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert
CREATE TRIGGER handle_order_insert_trigger
    BEFORE INSERT ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_insert();

-- Recreate the update trigger
CREATE TRIGGER update_order_updated_at
    BEFORE UPDATE ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 