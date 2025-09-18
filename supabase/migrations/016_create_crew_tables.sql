-- Create crew category table
CREATE TABLE IF NOT EXISTS crew_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crew product table
CREATE TABLE IF NOT EXISTS crew_product (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES crew_category(id) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currency(id) ON DELETE RESTRICT,
    tax_behavior INTEGER NOT NULL REFERENCES tax_behavior(id) ON DELETE RESTRICT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    pricing_type_id INTEGER NOT NULL REFERENCES pricing_type(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crew_product_category_id ON crew_product(category_id);
CREATE INDEX IF NOT EXISTS idx_crew_product_currency_id ON crew_product(currency_id);
CREATE INDEX IF NOT EXISTS idx_crew_product_tax_behavior ON crew_product(tax_behavior);
CREATE INDEX IF NOT EXISTS idx_crew_product_pricing_type_id ON crew_product(pricing_type_id);

-- Add RLS policies
ALTER TABLE crew_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_product ENABLE ROW LEVEL SECURITY;

-- RLS policies for crew_category
CREATE POLICY "Allow authenticated users to view crew categories" ON crew_category
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert crew categories" ON crew_category
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update crew categories" ON crew_category
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete crew categories" ON crew_category
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS policies for crew_product
CREATE POLICY "Allow authenticated users to view crew products" ON crew_product
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert crew products" ON crew_product
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update crew products" ON crew_product
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete crew products" ON crew_product
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some default crew categories
INSERT INTO crew_category (name) VALUES 
    ('Pilot'),
    ('Flight Attendant'),
    ('Ground Crew'),
    ('Maintenance'),
    ('Security'),
    ('Catering'),
    ('Cleaning'),
    ('Administrative')
ON CONFLICT (name) DO NOTHING;

-- Insert some sample crew products
INSERT INTO crew_product (category_id, currency_id, tax_behavior, price, pricing_type_id) VALUES 
    (1, 1, 2, 150.00, 1), -- Pilot, USD, Tax Exclusive, $150, Per Person
    (2, 1, 2, 75.00, 1),  -- Flight Attendant, USD, Tax Exclusive, $75, Per Person
    (3, 1, 2, 60.00, 1),  -- Ground Crew, USD, Tax Exclusive, $60, Per Person
    (4, 1, 2, 80.00, 1),  -- Maintenance, USD, Tax Exclusive, $80, Per Person
    (5, 1, 2, 65.00, 1)   -- Security, USD, Tax Exclusive, $65, Per Person
ON CONFLICT DO NOTHING;
