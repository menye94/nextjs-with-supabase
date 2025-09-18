-- Migration to update equipment_categories owner_id to link to companies table
-- This migration changes the owner_id foreign key from users to companies

-- 1. Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'equipment_categories_owner_id_fkey' 
        AND table_name = 'equipment_categories'
    ) THEN
        ALTER TABLE equipment_categories 
        DROP CONSTRAINT equipment_categories_owner_id_fkey;
    END IF;
END $$;

-- 2. Add new foreign key constraint linking to companies table
ALTER TABLE equipment_categories 
ADD CONSTRAINT fk_equipment_categories_company_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE SET NULL;

-- 3. Update RLS policies to reflect the new relationship
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert equipment categories" ON equipment_categories;
DROP POLICY IF EXISTS "Users can update their own equipment categories" ON equipment_categories;
DROP POLICY IF EXISTS "Users can delete their own equipment categories" ON equipment_categories;

-- Create new policies for company-based ownership
CREATE POLICY "Users can insert equipment categories" ON equipment_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment categories" ON equipment_categories
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment categories" ON equipment_categories
    FOR DELETE USING (true);

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_categories_owner_id ON equipment_categories(owner_id);

-- 5. Update the equipment_details view to include company owner information
CREATE OR REPLACE VIEW equipment_details AS
SELECT
    e.id,
    e.name as equipment_name,
    e.price,
    e.is_active,
    e.created_at,
    e.updated_at,
    ec.name as category_name,
    ec.id as category_id,
    eqc.name as company_name,
    eqc.id as company_id,
    c.code as currency_code,
    c.symbol as currency_symbol,
    ept.name as pricing_type_name,
    ept.description as pricing_type_description,
    owner_company.name as owner_company_name
FROM equipments e
LEFT JOIN equipment_categories ec ON e.category_id = ec.id
LEFT JOIN equipment_company eqc ON e.company_id = eqc.id
LEFT JOIN currencies c ON e.currency_id = c.id
LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
LEFT JOIN companies owner_company ON ec.owner_id = owner_company.id; 