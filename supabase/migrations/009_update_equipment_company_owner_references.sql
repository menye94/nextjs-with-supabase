-- Migration to update equipment_company and equipments tables
-- This migration changes company_id to owner_id and references companies table

-- 1. Update equipment_company table
-- First, drop the existing foreign key constraint
ALTER TABLE equipment_company 
DROP CONSTRAINT IF EXISTS fk_equipment_company_parent;

-- Rename the column from company_id to owner_id
ALTER TABLE equipment_company 
RENAME COLUMN company_id TO owner_id;

-- Add new foreign key constraint linking to companies table
ALTER TABLE equipment_company 
ADD CONSTRAINT fk_equipment_company_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Update the unique constraint to use owner_id instead of company_id
ALTER TABLE equipment_company 
DROP CONSTRAINT IF EXISTS unique_company_name;

ALTER TABLE equipment_company 
ADD CONSTRAINT unique_company_name 
UNIQUE (name, owner_id);

-- Update the index
DROP INDEX IF EXISTS idx_equipment_company_company_id;
CREATE INDEX IF NOT EXISTS idx_equipment_company_owner_id ON equipment_company(owner_id);

-- 2. Update equipments table
-- First, drop the existing foreign key constraint
ALTER TABLE equipments 
DROP CONSTRAINT IF EXISTS fk_equipments_company;

-- Rename the column from company_id to owner_id
ALTER TABLE equipments 
RENAME COLUMN company_id TO owner_id;

-- Add new foreign key constraint linking to companies table
ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Update the index
DROP INDEX IF EXISTS idx_equipments_company_id;
CREATE INDEX IF NOT EXISTS idx_equipments_owner_id_new ON equipments(owner_id);

-- 3. Update the equipment_details view to reflect the new structure
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
    owner_company.name as owner_company_name,
    equipment_owner.name as equipment_owner_name
FROM equipments e
LEFT JOIN equipment_categories ec ON e.category_id = ec.id
LEFT JOIN equipment_company eqc ON e.owner_id = eqc.owner_id
LEFT JOIN currencies c ON e.currency_id = c.id
LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
LEFT JOIN companies owner_company ON ec.owner_id = owner_company.id
LEFT JOIN companies equipment_owner ON e.owner_id = equipment_owner.id;

-- 4. Update the utility functions to reflect the new structure
CREATE OR REPLACE FUNCTION get_equipment_by_company(company_name varchar)
RETURNS TABLE (
    id int,
    name varchar,
    price real,
    currency_code varchar,
    currency_symbol varchar,
    pricing_type_name varchar,
    category_name varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.price,
        c.code,
        c.symbol,
        ept.name,
        ec.name
    FROM equipments e
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    LEFT JOIN equipment_company eqc ON e.owner_id = eqc.owner_id
    LEFT JOIN currencies c ON e.currency_id = c.id
    LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
    WHERE eqc.name = company_name AND e.is_active = true;
END;
$$ LANGUAGE plpgsql; 