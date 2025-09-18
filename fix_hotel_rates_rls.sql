-- Fix hotel_rates table RLS policies
-- Add owner_id column to hotel_rates table
ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS owner_id INT;

-- Update existing records to set owner_id based on the hotel's owner_id
UPDATE hotel_rates 
SET owner_id = h.owner_id 
FROM hotels h 
WHERE hotel_rates.hotel_id = h.id 
AND hotel_rates.owner_id IS NULL;

-- Make owner_id NOT NULL after updating existing records
ALTER TABLE hotel_rates ALTER COLUMN owner_id SET NOT NULL;

-- Add foreign key constraint for owner_id
ALTER TABLE hotel_rates 
ADD CONSTRAINT fk_hotel_rates_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Drop existing RLS policies for hotel_rates
DROP POLICY IF EXISTS "Users can view own hotel rates" ON hotel_rates;
DROP POLICY IF EXISTS "Users can insert own hotel rates" ON hotel_rates;
DROP POLICY IF EXISTS "Users can update own hotel rates" ON hotel_rates;
DROP POLICY IF EXISTS "Users can delete own hotel rates" ON hotel_rates;

-- Create new RLS policies for hotel_rates table (matching hotels table pattern)
CREATE POLICY "Users can view own hotel rates" ON hotel_rates
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own hotel rates" ON hotel_rates
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own hotel rates" ON hotel_rates
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own hotel rates" ON hotel_rates
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Add index for owner_id
CREATE INDEX IF NOT EXISTS idx_hotel_rates_owner_id ON hotel_rates(owner_id); 