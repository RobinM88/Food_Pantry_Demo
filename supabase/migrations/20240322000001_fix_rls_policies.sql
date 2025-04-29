-- Drop existing policies
DROP POLICY IF EXISTS "Volunteers can view all clients" ON "Client";
DROP POLICY IF EXISTS "Volunteers can create clients" ON "Client";
DROP POLICY IF EXISTS "Volunteers can update clients" ON "Client";
DROP POLICY IF EXISTS "Volunteers can view all orders" ON "Order";
DROP POLICY IF EXISTS "Volunteers can create orders" ON "Order";
DROP POLICY IF EXISTS "Volunteers can update orders" ON "Order";
DROP POLICY IF EXISTS "Volunteers can view all phone logs" ON "PhoneLog";
DROP POLICY IF EXISTS "Volunteers can create phone logs" ON "PhoneLog";
DROP POLICY IF EXISTS "Volunteers can update phone logs" ON "PhoneLog";
DROP POLICY IF EXISTS "Volunteers can view all connected families" ON "ConnectedFamily";
DROP POLICY IF EXISTS "Volunteers can create connected families" ON "ConnectedFamily";
DROP POLICY IF EXISTS "Volunteers can update connected families" ON "ConnectedFamily";

-- Create new policies that check for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON "Client"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "Client"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "Client"
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Order policies
CREATE POLICY "Enable read access for authenticated users" ON "Order"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "Order"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "Order"
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- PhoneLog policies
CREATE POLICY "Enable read access for authenticated users" ON "PhoneLog"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "PhoneLog"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "PhoneLog"
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ConnectedFamily policies
CREATE POLICY "Enable read access for authenticated users" ON "ConnectedFamily"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "ConnectedFamily"
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "ConnectedFamily"
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true); 