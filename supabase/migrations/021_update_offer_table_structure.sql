-- Migration: Update offer table structure
-- Remove agent_id and customer_id, add client_id linking to clients table

-- First, drop the dependent view that references the old columns
DROP VIEW IF EXISTS offers_with_totals;

-- Drop the existing foreign key constraints
ALTER TABLE offer DROP CONSTRAINT IF EXISTS offer_agent_id_fkey;
ALTER TABLE offer DROP CONSTRAINT IF EXISTS offer_customer_id_fkey;

-- Drop the columns
ALTER TABLE offer DROP COLUMN IF EXISTS agent_id;
ALTER TABLE offer DROP COLUMN IF EXISTS customer_id;

-- Add the new client_id column
ALTER TABLE offer ADD COLUMN client_id INTEGER NOT NULL;

-- Add foreign key constraint for client_id
ALTER TABLE offer ADD CONSTRAINT offer_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES customers(id) ON DELETE RESTRICT;

-- Create index on client_id for better performance
CREATE INDEX IF NOT EXISTS idx_offer_client_id ON offer(client_id);

-- Update RLS policies to use client_id instead of customer_id
DROP POLICY IF EXISTS "Enable read access for company users" ON offer;
DROP POLICY IF EXISTS "Enable insert for company users" ON offer;
DROP POLICY IF EXISTS "Enable update for company users" ON offer;
DROP POLICY IF EXISTS "Enable delete for company users" ON offer;

-- Create new RLS policies using client_id (keeping the same structure as existing policies)
CREATE POLICY "Enable read access for company users" ON offer
  FOR SELECT USING (
    owner_id IN (
      SELECT memberships.company_id FROM memberships WHERE memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for company users" ON offer
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT memberships.company_id FROM memberships WHERE memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for company users" ON offer
  FOR UPDATE USING (
    owner_id IN (
      SELECT memberships.company_id FROM memberships WHERE memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for company users" ON offer
  FOR DELETE USING (
    owner_id IN (
      SELECT memberships.company_id FROM memberships WHERE memberships.user_id = auth.uid()
    )
  );

-- Recreate the offers_with_totals view with the new structure
CREATE VIEW offers_with_totals AS
SELECT 
    o.id,
    o.offer_code,
    o.offer_name,
    o.active_from,
    o.active_to,
    o.time_accepted,
    o.accepted,
    o.promo_offer_id,
    o.client_id,
    o.owner_id,
    o.created_at,
    o.updated_at,
    calculate_offer_total(o.id) AS calculated_total,
    CONCAT(c.cus_first_name, ' ', c.cus_last_name) AS client_name,
    co.company_name
FROM offer o
LEFT JOIN customers c ON o.client_id = c.id
LEFT JOIN companies co ON o.owner_id = co.id;

-- Add comment to document the change
COMMENT ON COLUMN offer.client_id IS 'References customers table - replaces the old agent_id and customer_id columns';
