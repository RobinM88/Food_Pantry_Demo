-- Enable RLS for ContactNote table
ALTER TABLE "ContactNote" ENABLE ROW LEVEL SECURITY;

-- ContactNote table policies
CREATE POLICY "Volunteers can view all contact notes"
ON "ContactNote" FOR SELECT
USING (is_volunteer());

CREATE POLICY "Volunteers can create contact notes"
ON "ContactNote" FOR INSERT
WITH CHECK (is_volunteer());

CREATE POLICY "Volunteers can update contact notes"
ON "ContactNote" FOR UPDATE
USING (is_volunteer())
WITH CHECK (is_volunteer()); 