-- Equipment Management System Migration
-- This migration sets up the complete equipment management system

-- 1. Create equipment_categories table (if not exists)
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

-- 2. Create equipment_company table (if not exists)
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

-- 3. Create equipments table (if not exists)
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

-- 4. Create currencies table (if not exists)
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

-- 5. Create equipment_pricing_types table (if not exists)
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
('Daily', 'Price per day'),
('Weekly', 'Price per week'),
('Monthly', 'Price per month'),
('Hourly', 'Price per hour'),
('One-time', 'One-time rental fee')
ON CONFLICT (name) DO NOTHING;

-- 9. Insert sample equipment categories
INSERT INTO equipment_categories (name) VALUES
('Camping Gear'),
('Safari Vehicles'),
('Photography Equipment'),
('Water Sports Equipment'),
('Kitchen Equipment'),
('Medical Supplies'),
('Communication Devices'),
('Safety Equipment')
ON CONFLICT (name) DO NOTHING;

-- 10. Create RLS policies for equipment_categories
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all equipment categories" ON equipment_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment categories" ON equipment_categories
    FOR INSERT WITH CHECK (auth.uid()::int = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update their own equipment categories" ON equipment_categories
    FOR UPDATE USING (auth.uid()::int = owner_id);

CREATE POLICY "Users can delete their own equipment categories" ON equipment_categories
    FOR DELETE USING (auth.uid()::int = owner_id);

-- 11. Create RLS policies for equipment_company
ALTER TABLE equipment_company ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all equipment companies" ON equipment_company
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment companies" ON equipment_company
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment companies" ON equipment_company
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment companies" ON equipment_company
    FOR DELETE USING (true);

-- 12. Create RLS policies for equipments
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all equipments" ON equipments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own equipments" ON equipments
    FOR INSERT WITH CHECK (auth.uid()::int = owner_id);

CREATE POLICY "Users can update their own equipments" ON equipments
    FOR UPDATE USING (auth.uid()::int = owner_id);

CREATE POLICY "Users can delete their own equipments" ON equipments
    FOR DELETE USING (auth.uid()::int = owner_id);

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipments_category_id ON equipments(category_id);
CREATE INDEX IF NOT EXISTS idx_equipments_company_id ON equipments(company_id);
CREATE INDEX IF NOT EXISTS idx_equipments_owner_id ON equipments(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipments_pricing_type_id ON equipments(pricing_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_company_city_id ON equipment_company(city_id);
CREATE INDEX IF NOT EXISTS idx_equipment_company_company_id ON equipment_company(company_id);

-- 14. Create a view for equipment with all related data
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
    u.email as owner_email
FROM equipments e
LEFT JOIN equipment_categories ec ON e.category_id = ec.id
LEFT JOIN equipment_company eqc ON e.company_id = eqc.id
LEFT JOIN currencies c ON e.currency_id = c.id
LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
LEFT JOIN auth.users u ON e.owner_id = u.id::int;

-- 15. Create function to get equipment by category
CREATE OR REPLACE FUNCTION get_equipment_by_category(category_name varchar)
RETURNS TABLE (
    id int,
    name varchar,
    price real,
    currency_code varchar,
    currency_symbol varchar,
    pricing_type_name varchar,
    company_name varchar
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
        eqc.name
    FROM equipments e
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    LEFT JOIN equipment_company eqc ON e.company_id = eqc.id
    LEFT JOIN currencies c ON e.currency_id = c.id
    LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
    WHERE ec.name = category_name AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to get equipment by company
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
    LEFT JOIN equipment_company eqc ON e.company_id = eqc.id
    LEFT JOIN currencies c ON e.currency_id = c.id
    LEFT JOIN equipment_pricing_types ept ON e.pricing_type_id = ept.id
    WHERE eqc.name = company_name AND e.is_active = true;
END;
$$ LANGUAGE plpgsql; 