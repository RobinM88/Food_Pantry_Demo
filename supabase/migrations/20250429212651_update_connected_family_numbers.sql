-- First, drop the existing foreign key constraint
ALTER TABLE "ConnectedFamily" DROP CONSTRAINT IF EXISTS "ConnectedFamily_connected_family_number_fkey";

-- Update existing connected_family_number values to use 'cf' prefix
UPDATE "ConnectedFamily"
SET connected_family_number = 'cf' || substring(connected_family_number, 2)
WHERE connected_family_number LIKE 'f%';

-- Add a check constraint to ensure connected_family_number starts with 'cf'
ALTER TABLE "ConnectedFamily"
ADD CONSTRAINT connected_family_number_prefix_check 
CHECK (connected_family_number LIKE 'cf%');
