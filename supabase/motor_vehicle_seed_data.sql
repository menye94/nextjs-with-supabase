-- Seed data for motor vehicle tables
-- This file contains sample data for testing and development

-- Insert additional motor vehicle entry types if needed
INSERT INTO motor_vehicle_entry_type (name, is_active) VALUES
  ('ATV (All-Terrain Vehicle)', true),
  ('RV (Recreational Vehicle)', true),
  ('Commercial Vehicle', true),
  ('Agricultural Vehicle', true),
  ('Construction Vehicle', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample motor vehicle products (assuming you have parks with IDs 1, 2, 3)
-- Note: Adjust park_id values based on your actual national_parks data
INSERT INTO motor_vehicle_products (park_id, motor_vehicle_entry_type_id, low_weight, high_weight, is_active) VALUES
  (1, 1, 0, 200),           -- Motorcycle: 0-200kg
  (1, 2, 200, 1500),        -- Car: 200-1500kg
  (1, 3, 1500, 3000),       -- SUV: 1500-3000kg
  (1, 4, 3000, 8000),       -- Truck: 3000-8000kg
  (1, 5, 8000, 15000),      -- Bus: 8000-15000kg
  (1, 6, 0, 5000),          -- Trailer: 0-5000kg
  (1, 7, 5000, 50000),      -- Heavy Equipment: 5000-50000kg
  
  (2, 1, 0, 200),           -- Motorcycle: 0-200kg
  (2, 2, 200, 1500),        -- Car: 200-1500kg
  (2, 3, 1500, 3000),       -- SUV: 1500-3000kg
  (2, 4, 3000, 8000),       -- Truck: 3000-8000kg
  
  (3, 1, 0, 200),           -- Motorcycle: 0-200kg
  (3, 2, 200, 1500),        -- Car: 200-1500kg
  (3, 3, 1500, 3000),       -- SUV: 1500-3000kg
  (3, 4, 3000, 8000),       -- Truck: 3000-8000kg
  (3, 6, 0, 5000)           -- Trailer: 0-5000kg
ON CONFLICT DO NOTHING;

-- Insert sample motor vehicle product prices
-- Note: Adjust IDs based on your actual data and assuming you have tax_behaviour and currency records
-- You may need to run this after the products are created and you have the actual IDs
INSERT INTO motor_vehicle_products_price (tax_behaviour_id, motor_vehicle_product_id, currency_id, unit_amount, is_active) VALUES
  -- Assuming tax_behaviour_id = 1 (standard tax) and currency_id = 1 (USD)
  (1, 1, 1, 15.00),         -- Motorcycle entry fee
  (1, 2, 1, 25.00),         -- Car entry fee
  (1, 3, 1, 35.00),         -- SUV entry fee
  (1, 4, 1, 50.00),         -- Truck entry fee
  (1, 5, 1, 75.00),         -- Bus entry fee
  (1, 6, 1, 20.00),         -- Trailer entry fee
  (1, 7, 1, 100.00),        -- Heavy Equipment entry fee
  
  -- Park 2 prices
  (1, 8, 1, 12.00),         -- Motorcycle entry fee
  (1, 9, 1, 22.00),         -- Car entry fee
  (1, 10, 1, 32.00),        -- SUV entry fee
  (1, 11, 1, 45.00),        -- Truck entry fee
  
  -- Park 3 prices
  (1, 12, 1, 18.00),        -- Motorcycle entry fee
  (1, 13, 1, 28.00),        -- Car entry fee
  (1, 14, 1, 38.00),        -- SUV entry fee
  (1, 15, 1, 55.00),        -- Truck entry fee
  (1, 16, 1, 25.00)         -- Trailer entry fee
ON CONFLICT DO NOTHING;

-- Create a view for easy querying of motor vehicle products with prices
CREATE OR REPLACE VIEW motor_vehicle_products_with_prices AS
SELECT 
  mvp.id,
  mvp.park_id,
  np.national_park_name as park_name,
  mvp.motor_vehicle_entry_type_id,
  mvet.name as vehicle_type_name,
  mvp.low_weight,
  mvp.high_weight,
  mvp.is_active as product_active,
  mvp.is_deleted as product_deleted,
  mvp.created_at as product_created_at,
  mvp.updated_at as product_updated_at,
  mvpp.id as price_id,
  mvpp.tax_behaviour_id,
  tb.name as tax_behaviour_name,
  mvpp.currency_id,
  c.name as currency_name,
  c.symbol as currency_symbol,
  mvpp.unit_amount,
  mvpp.is_active as price_active,
  mvpp.is_deleted as price_deleted,
  mvpp.created_at as price_created_at,
  mvpp.updated_at as price_updated_at
FROM motor_vehicle_products mvp
LEFT JOIN national_parks np ON mvp.park_id = np.id
LEFT JOIN motor_vehicle_entry_type mvet ON mvp.motor_vehicle_entry_type_id = mvet.id
LEFT JOIN motor_vehicle_products_price mvpp ON mvp.id = mvpp.motor_vehicle_product_id
LEFT JOIN tax_behaviour tb ON mvpp.tax_behaviour_id = tb.id
LEFT JOIN currency c ON mvpp.currency_id = c.id
WHERE mvp.is_deleted = false 
  AND mvet.is_deleted = false
  AND (mvpp.is_deleted = false OR mvpp.is_deleted IS NULL);

-- Create a summary view for motor vehicle products by park
CREATE OR REPLACE VIEW motor_vehicle_products_summary AS
SELECT 
  mvp.park_id,
  np.national_park_name as park_name,
  mvet.name as vehicle_type_name,
  COUNT(mvp.id) as product_count,
  MIN(mvp.low_weight) as min_weight,
  MAX(mvp.high_weight) as max_weight,
  AVG(mvpp.unit_amount) as avg_price,
  MIN(mvpp.unit_amount) as min_price,
  MAX(mvpp.unit_amount) as max_price
FROM motor_vehicle_products mvp
LEFT JOIN national_parks np ON mvp.park_id = np.id
LEFT JOIN motor_vehicle_entry_type mvet ON mvp.motor_vehicle_entry_type_id = mvet.id
LEFT JOIN motor_vehicle_products_price mvpp ON mvp.id = mvpp.motor_vehicle_product_id
WHERE mvp.is_deleted = false 
  AND mvet.is_deleted = false
  AND (mvpp.is_deleted = false OR mvpp.is_deleted IS NULL)
GROUP BY mvp.park_id, np.national_park_name, mvet.name
ORDER BY np.national_park_name, mvet.name;
