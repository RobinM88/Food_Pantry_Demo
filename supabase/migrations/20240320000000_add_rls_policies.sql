-- Enable Row Level Security
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhoneLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectedFamily" ENABLE ROW LEVEL SECURITY;

-- Create a role for volunteers
CREATE ROLE volunteer;

-- Grant basic permissions to volunteers
GRANT USAGE ON SCHEMA public TO volunteer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO volunteer;

-- Client table policies
CREATE POLICY "Volunteers can view all clients"
ON "Client" FOR SELECT
TO volunteer
USING (true);

CREATE POLICY "Volunteers can create clients"
ON "Client" FOR INSERT
TO volunteer
WITH CHECK (true);

CREATE POLICY "Volunteers can update clients"
ON "Client" FOR UPDATE
TO volunteer
USING (true)
WITH CHECK (true);

-- Order table policies
CREATE POLICY "Volunteers can view all orders"
ON "Order" FOR SELECT
TO volunteer
USING (true);

CREATE POLICY "Volunteers can create orders"
ON "Order" FOR INSERT
TO volunteer
WITH CHECK (true);

CREATE POLICY "Volunteers can update orders"
ON "Order" FOR UPDATE
TO volunteer
USING (true)
WITH CHECK (true);

-- PhoneLog table policies
CREATE POLICY "Volunteers can view all phone logs"
ON "PhoneLog" FOR SELECT
TO volunteer
USING (true);

CREATE POLICY "Volunteers can create phone logs"
ON "PhoneLog" FOR INSERT
TO volunteer
WITH CHECK (true);

CREATE POLICY "Volunteers can update phone logs"
ON "PhoneLog" FOR UPDATE
TO volunteer
USING (true)
WITH CHECK (true);

-- ConnectedFamily table policies
CREATE POLICY "Volunteers can view all connected families"
ON "ConnectedFamily" FOR SELECT
TO volunteer
USING (true);

CREATE POLICY "Volunteers can create connected families"
ON "ConnectedFamily" FOR INSERT
TO volunteer
WITH CHECK (true);

CREATE POLICY "Volunteers can update connected families"
ON "ConnectedFamily" FOR UPDATE
TO volunteer
USING (true)
WITH CHECK (true);

-- Create a function to check if a user is a volunteer
CREATE OR REPLACE FUNCTION is_volunteer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'volunteer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to use the volunteer check function
ALTER POLICY "Volunteers can view all clients" ON "Client"
USING (is_volunteer());

ALTER POLICY "Volunteers can create clients" ON "Client"
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can update clients" ON "Client"
USING (is_volunteer())
WITH CHECK (is_volunteer());

-- Similar updates for other tables...
ALTER POLICY "Volunteers can view all orders" ON "Order"
USING (is_volunteer());

ALTER POLICY "Volunteers can create orders" ON "Order"
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can update orders" ON "Order"
USING (is_volunteer())
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can view all phone logs" ON "PhoneLog"
USING (is_volunteer());

ALTER POLICY "Volunteers can create phone logs" ON "PhoneLog"
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can update phone logs" ON "PhoneLog"
USING (is_volunteer())
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can view all connected families" ON "ConnectedFamily"
USING (is_volunteer());

ALTER POLICY "Volunteers can create connected families" ON "ConnectedFamily"
WITH CHECK (is_volunteer());

ALTER POLICY "Volunteers can update connected families" ON "ConnectedFamily"
USING (is_volunteer())
WITH CHECK (is_volunteer()); 