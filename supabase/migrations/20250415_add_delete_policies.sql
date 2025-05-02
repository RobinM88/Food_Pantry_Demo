-- Add delete policies to tables
-- These policies allow authenticated users to delete records

-- Client table delete policy
CREATE POLICY "Allow authenticated users to delete clients"
ON "Client"
FOR DELETE
TO authenticated
USING (true);

-- Order table delete policy
CREATE POLICY "Allow authenticated users to delete orders"
ON "Order"
FOR DELETE
TO authenticated
USING (true);

-- PhoneLog table delete policy
CREATE POLICY "Allow authenticated users to delete phone logs"
ON "PhoneLog"
FOR DELETE
TO authenticated
USING (true);

-- ConnectedFamily table delete policy
CREATE POLICY "Allow authenticated users to delete connected families"
ON "ConnectedFamily"
FOR DELETE
TO authenticated
USING (true); 