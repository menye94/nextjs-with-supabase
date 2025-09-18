-- Equipment Management System - Complete Migration Script
-- Run this in your Supabase SQL Editor to set up the equipment management system

-- =====================================================
-- MIGRATION 007: Equipment Management System
-- =====================================================

-- 1. Create equipment_categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
    id serial NOT NULL,
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    owner_id int,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_equipment_category UNIQUE (name)
);

-- 2. Create equipment_company table
CREATE TABLE IF NOT EXISTS equipment_company (
    id serial NOT NULL,
    name varchar NOT NULL,
    city_id int NOT NULL,
    company_id int NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_company_name UNIQUE (name, company_id)
);

-- 3. Create equipments table
CREATE TABLE IF NOT EXISTS equipments (
    id serial NOT NULL,
    category_id int NOT NULL,
    company_id int NOT NULL,
    name varchar NOT NULL,
    currency_id int NOT NULL,
    price real,
    owner_id int NOT NULL,
    pricing_type_id int NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_equipment_name_owner_id UNIQUE (name, owner_id)
);

-- 4. Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id serial NOT NULL,
    code varchar(3) NOT NULL,
    name varchar NOT NULL,
    symbol varchar(5),
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_currency_code UNIQUE (code)
);

-- 5. Create equipment_pricing_types table
CREATE TABLE IF NOT EXISTS equipment_pricing_types (
    id serial NOT NULL,
    name varchar NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_pricing_type_name UNIQUE (name)
);

-- 6. Add foreign key constraints
ALTER TABLE equipment_company 
ADD CONSTRAINT fk_equipment_company_city 
FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;

ALTER TABLE equipment_company 
ADD CONSTRAINT fk_equipment_company_parent 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_category 
FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE CASCADE;

ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_company 
FOREIGN KEY (company_id) REFERENCES equipment_company(id) ON DELETE CASCADE;

ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_currency 
FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE;

ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_pricing_type 
FOREIGN KEY (pricing_type_id) REFERENCES equipment_pricing_types(id) ON DELETE CASCADE;

-- 7. Insert sample data for currencies
INSERT INTO currencies (code, name, symbol) VALUES
('USD', 'US Dollar', '$'),
('TZS', 'Tanzanian Shilling', 'TSh'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£')
ON CONFLICT (code) DO NOTHING;

-- 8. Insert sample data for equipment pricing types
INSERT INTO equipment_pricing_types (name, description) VALUES
('Daily Rate', 'Price per day'),
('Hourly Rate', 'Price per hour'),
('Weekly Rate', 'Price per week'),
('Monthly Rate', 'Price per month'),
('One-time Fee', 'Single payment for the entire duration')
ON CONFLICT (name) DO NOTHING;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_pricing_types ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for equipment_categories
CREATE POLICY "Users can view equipment categories" ON equipment_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment categories" ON equipment_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment categories" ON equipment_categories
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment categories" ON equipment_categories
    FOR DELETE USING (true);

-- 11. Create RLS policies for equipment_company
CREATE POLICY "Users can view equipment companies" ON equipment_company
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment companies" ON equipment_company
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment companies" ON equipment_company
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment companies" ON equipment_company
    FOR DELETE USING (true);

-- 12. Create RLS policies for equipments
CREATE POLICY "Users can view equipments" ON equipments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipments" ON equipments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipments" ON equipments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipments" ON equipments
    FOR DELETE USING (true);

-- 13. Create RLS policies for currencies
CREATE POLICY "Users can view currencies" ON currencies
    FOR SELECT USING (true);

CREATE POLICY "Users can insert currencies" ON currencies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update currencies" ON currencies
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete currencies" ON currencies
    FOR DELETE USING (true);

-- 14. Create RLS policies for equipment_pricing_types
CREATE POLICY "Users can view equipment pricing types" ON equipment_pricing_types
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment pricing types" ON equipment_pricing_types
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment pricing types" ON equipment_pricing_types
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment pricing types" ON equipment_pricing_types
    FOR DELETE USING (true);

-- 15. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_categories_owner_id ON equipment_categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_categories_name ON equipment_categories(name);
CREATE INDEX IF NOT EXISTS idx_equipment_company_name ON equipment_company(name);
CREATE INDEX IF NOT EXISTS idx_equipment_company_city_id ON equipment_company(city_id);
CREATE INDEX IF NOT EXISTS idx_equipment_company_company_id ON equipment_company(company_id);
CREATE INDEX IF NOT EXISTS idx_equipments_name ON equipments(name);
CREATE INDEX IF NOT EXISTS idx_equipments_category_id ON equipments(category_id);
CREATE INDEX IF NOT EXISTS idx_equipments_company_id ON equipments(company_id);
CREATE INDEX IF NOT EXISTS idx_equipments_owner_id ON equipments(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipments_pricing_type_id ON equipments(pricing_type_id);

-- 16. Create equipment_details view
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

-- 17. Create helper functions
CREATE OR REPLACE FUNCTION get_equipment_by_category(category_name varchar)
RETURNS TABLE (
    equipment_name varchar,
    price real,
    currency_code varchar,
    company_name varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.name, e.price, c.code, eqc.name
    FROM equipments e
    JOIN equipment_categories ec ON e.category_id = ec.id
    JOIN currencies c ON e.currency_id = c.id
    JOIN equipment_company eqc ON e.company_id = eqc.id
    WHERE ec.name ILIKE '%' || category_name || '%'
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_equipment_by_company(company_name varchar)
RETURNS TABLE (
    equipment_name varchar,
    category_name varchar,
    price real,
    currency_code varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.name, ec.name, e.price, c.code
    FROM equipments e
    JOIN equipment_categories ec ON e.category_id = ec.id
    JOIN equipment_company eqc ON e.company_id = eqc.id
    JOIN currencies c ON e.currency_id = c.id
    WHERE eqc.name ILIKE '%' || company_name || '%'
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION 008: Update equipment_categories owner_id
-- =====================================================

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
DROP POLICY IF EXISTS "Users can update equipment categories" ON equipment_categories;
DROP POLICY IF EXISTS "Users can delete equipment categories" ON equipment_categories;

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

-- =====================================================
-- MIGRATION 009: Update equipment_company and equipments
-- =====================================================

-- 1. Update equipment_company table
-- Drop existing foreign key constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equipment_company_parent' 
        AND table_name = 'equipment_company'
    ) THEN
        ALTER TABLE equipment_company 
        DROP CONSTRAINT fk_equipment_company_parent;
    END IF;
END $$;

-- Rename company_id to owner_id
ALTER TABLE equipment_company 
RENAME COLUMN company_id TO owner_id;

-- Add new foreign key constraint
ALTER TABLE equipment_company 
ADD CONSTRAINT fk_equipment_company_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Update unique constraint
ALTER TABLE equipment_company 
DROP CONSTRAINT IF EXISTS unique_company_name;

ALTER TABLE equipment_company 
ADD CONSTRAINT unique_company_name 
UNIQUE (name, owner_id);

-- Update index
DROP INDEX IF EXISTS idx_equipment_company_company_id;
CREATE INDEX IF NOT EXISTS idx_equipment_company_owner_id ON equipment_company(owner_id);

-- 2. Update equipments table
-- Drop existing foreign key constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equipments_company' 
        AND table_name = 'equipments'
    ) THEN
        ALTER TABLE equipments 
        DROP CONSTRAINT fk_equipments_company;
    END IF;
END $$;

-- Rename company_id to owner_id
ALTER TABLE equipments 
RENAME COLUMN company_id TO owner_id;

-- Add new foreign key constraint
ALTER TABLE equipments 
ADD CONSTRAINT fk_equipments_owner 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS idx_equipments_company_id;
CREATE INDEX IF NOT EXISTS idx_equipments_owner_id_new ON equipments(owner_id);

-- 3. Update equipment_details view
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

-- 4. Update helper functions
CREATE OR REPLACE FUNCTION get_equipment_by_company(company_name varchar)
RETURNS TABLE (
    equipment_name varchar,
    category_name varchar,
    price real,
    currency_code varchar
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.name, ec.name, e.price, c.code
    FROM equipments e
    JOIN equipment_categories ec ON e.category_id = ec.id
    JOIN equipment_company eqc ON e.owner_id = eqc.owner_id
    JOIN currencies c ON e.currency_id = c.id
    WHERE eqc.name ILIKE '%' || company_name || '%'
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Equipment Management System setup completed successfully!' as status; 