-- Seed data for testing the Products page

-- Insert sample countries
INSERT INTO countries (country_name) VALUES
  ('United States'),
  ('Canada'),
  ('South Africa'),
  ('Kenya'),
  ('Tanzania'),
  ('Botswana'),
  ('Zimbabwe'),
  ('Namibia'),
  ('Zambia'),
  ('Uganda')
ON CONFLICT (country_name) DO NOTHING;

-- Insert sample national park circuits
INSERT INTO national_park_circuit (national_park_circuit_name) VALUES
  ('Western Circuit'),
  ('Northern Circuit'),
  ('Southern Circuit'),
  ('Eastern Circuit'),
  ('Central Circuit'),
  ('Coastal Circuit'),
  ('Mountain Circuit'),
  ('Desert Circuit'),
  ('Forest Circuit'),
  ('Savanna Circuit')
ON CONFLICT (national_park_circuit_name) DO NOTHING;

-- Insert sample entry types
INSERT INTO entry_type (entry_name, is_active) VALUES
  ('Day Visit', true),
  ('Overnight Stay', true),
  ('Camping', true),
  ('Luxury Lodge', true),
  ('Guided Tour', true),
  ('Self-Drive', true),
  ('Walking Safari', true),
  ('Photography Tour', true)
ON CONFLICT DO NOTHING;

-- Insert sample park categories
INSERT INTO park_category (category_name, is_active) VALUES
  ('Wildlife Reserve', true),
  ('National Park', true),
  ('Conservation Area', true),
  ('Game Reserve', true),
  ('Marine Park', true),
  ('Forest Reserve', true),
  ('Mountain Park', true),
  ('Desert Park', true)
ON CONFLICT DO NOTHING;

-- Insert sample camping types
INSERT INTO camping_type (name, is_active) VALUES
  ('Tent Camping', true),
  ('RV Camping', true),
  ('Glamping', true),
  ('Backpacking', true),
  ('Group Camping', true),
  ('Primitive Camping', true),
  ('Car Camping', true),
  ('Hiking Camping', true)
ON CONFLICT DO NOTHING;

-- Insert sample currencies
INSERT INTO currency (currency_name) VALUES
  ('USD'),
  ('EUR'),
  ('GBP'),
  ('ZAR'),
  ('KES'),
  ('TZS'),
  ('BWP'),
  ('ZWL'),
  ('NAD'),
  ('ZMW')
ON CONFLICT (currency_name) DO NOTHING;

-- Insert sample pricing types
INSERT INTO pricing_type (pricing_type_name) VALUES
  ('Per Person'),
  ('Per Vehicle'),
  ('Per Group'),
  ('Per Night'),
  ('Per Day'),
  ('Per Tour'),
  ('Per Activity'),
  ('Per Package')
ON CONFLICT DO NOTHING;

-- Insert sample age groups
INSERT INTO age_group (age_group_name, min_age, max_age) VALUES
  ('Infant (0-2)', 0, 2),
  ('Child (3-12)', 3, 12),
  ('Teen (13-17)', 13, 17),
  ('Adult (18-64)', 18, 64),
  ('Senior (65+)', 65, 120)
ON CONFLICT DO NOTHING;

-- Insert sample seasons
INSERT INTO seasons (season_name, start_date, end_date) VALUES
  ('Peak Season', '2024-06-01', '2024-10-31'),
  ('Low Season', '2024-11-01', '2024-05-31'),
  ('Shoulder Season', '2024-04-01', '2024-05-31'),
  ('Holiday Season', '2024-12-01', '2024-12-31'),
  ('Migration Season', '2024-07-01', '2024-09-30')
ON CONFLICT DO NOTHING;

-- Insert sample tax behaviors
INSERT INTO tax_behaviour (name) VALUES
  ('Tax Inclusive'),
  ('Tax Exclusive'),
  ('Tax Exempt'),
  ('VAT Included'),
  ('Service Charge Included')
ON CONFLICT DO NOTHING; 