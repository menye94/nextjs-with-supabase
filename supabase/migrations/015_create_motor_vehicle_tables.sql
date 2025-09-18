-- Create motor vehicle entry type table
CREATE TABLE IF NOT EXISTS motor_vehicle_entry_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create motor vehicle products table
CREATE TABLE IF NOT EXISTS motor_vehicle_products (
  id SERIAL PRIMARY KEY,
  park_id INTEGER NOT NULL REFERENCES national_parks(id) ON DELETE CASCADE,
  motor_vehicle_entry_type_id INTEGER NOT NULL REFERENCES motor_vehicle_entry_type(id) ON DELETE CASCADE,
  low_weight INTEGER NOT NULL CHECK (low_weight >= 0),
  high_weight INTEGER NOT NULL CHECK (high_weight >= 0),
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure high_weight is greater than or equal to low_weight
  CONSTRAINT check_weight_range CHECK (high_weight >= low_weight)
);

-- Create motor vehicle products price table
CREATE TABLE IF NOT EXISTS motor_vehicle_products_price (
  id SERIAL PRIMARY KEY,
  tax_behaviour_id INTEGER NOT NULL REFERENCES tax_behaviour(id) ON DELETE CASCADE,
  motor_vehicle_product_id INTEGER NOT NULL REFERENCES motor_vehicle_products(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES currency(id) ON DELETE CASCADE,
  unit_amount DECIMAL(10,2) NOT NULL CHECK (unit_amount >= 0),
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_motor_vehicle_products_park_id ON motor_vehicle_products(park_id);
CREATE INDEX IF NOT EXISTS idx_motor_vehicle_products_entry_type_id ON motor_vehicle_products(motor_vehicle_entry_type_id);
CREATE INDEX IF NOT EXISTS idx_motor_vehicle_products_price_product_id ON motor_vehicle_products_price(motor_vehicle_product_id);
CREATE INDEX IF NOT EXISTS idx_motor_vehicle_products_price_tax_behaviour_id ON motor_vehicle_products_price(tax_behaviour_id);
CREATE INDEX IF NOT EXISTS idx_motor_vehicle_products_price_currency_id ON motor_vehicle_products_price(currency_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_motor_vehicle_products_unique ON motor_vehicle_products(park_id, motor_vehicle_entry_type_id, low_weight, high_weight) WHERE NOT is_deleted;
CREATE UNIQUE INDEX IF NOT EXISTS idx_motor_vehicle_products_price_unique ON motor_vehicle_products_price(motor_vehicle_product_id, tax_behaviour_id, currency_id) WHERE NOT is_deleted;

-- Add RLS policies (assuming you want to enable RLS)
ALTER TABLE motor_vehicle_entry_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_vehicle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_vehicle_products_price ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for motor_vehicle_entry_type
CREATE POLICY "Users can view active motor vehicle entry types" ON motor_vehicle_entry_type
  FOR SELECT USING (is_active = true AND is_deleted = false);

CREATE POLICY "Users can insert motor vehicle entry types" ON motor_vehicle_entry_type
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update motor vehicle entry types" ON motor_vehicle_entry_type
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete motor vehicle entry types" ON motor_vehicle_entry_type
  FOR DELETE USING (true);

-- Create RLS policies for motor_vehicle_products
CREATE POLICY "Users can view active motor vehicle products" ON motor_vehicle_products
  FOR SELECT USING (is_active = true AND is_deleted = false);

CREATE POLICY "Users can insert motor vehicle products" ON motor_vehicle_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update motor vehicle products" ON motor_vehicle_products
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete motor vehicle products" ON motor_vehicle_products
  FOR DELETE USING (true);

-- Create RLS policies for motor_vehicle_products_price
CREATE POLICY "Users can view active motor vehicle product prices" ON motor_vehicle_products_price
  FOR SELECT USING (is_active = true AND is_deleted = false);

CREATE POLICY "Users can insert motor vehicle product prices" ON motor_vehicle_products_price
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update motor vehicle product prices" ON motor_vehicle_products_price
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete motor vehicle product prices" ON motor_vehicle_products_price
  FOR DELETE USING (true);

-- Insert some sample motor vehicle entry types
INSERT INTO motor_vehicle_entry_type (name, is_active) VALUES
  ('Motorcycle', true),
  ('Car', true),
  ('SUV', true),
  ('Truck', true),
  ('Bus', true),
  ('Trailer', true),
  ('Heavy Equipment', true)
ON CONFLICT (name) DO NOTHING;
