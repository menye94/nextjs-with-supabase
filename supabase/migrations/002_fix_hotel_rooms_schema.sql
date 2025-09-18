-- Fix Hotel and Rooms Schema
-- This migration ensures all hotel-related tables and functions are properly created

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hotel_category table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_category (
  id SERIAL NOT NULL,
  category_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT unique_hotel_category_name UNIQUE (category_name)
);

-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL NOT NULL,
  location_name VARCHAR NOT NULL,
  country_id INT,
  city_id INT,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT fk_locations_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_locations_city FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Create hotels table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL NOT NULL,
  hotel_name VARCHAR NOT NULL,
  owner_id UUID NOT NULL,
  location_id INT NOT NULL,
  category_id INT NOT NULL,
  camping_type_id INT,
  is_partner BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  contact_email VARCHAR,
  hotel_website VARCHAR,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id),
  CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotels_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT fk_hotels_category FOREIGN KEY (category_id) REFERENCES hotel_category(id),
  CONSTRAINT fk_hotels_camping_type FOREIGN KEY (camping_type_id) REFERENCES camping_type(id)
);

-- Create rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL NOT NULL,
  owner_id UUID NOT NULL,
  room_name VARCHAR NOT NULL,
  room_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  CONSTRAINT fk_rooms_owner FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT unique_room_name_per_company UNIQUE (owner_id, room_name)
);

-- Create hotel_rooms junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id SERIAL NOT NULL,
  owner_id UUID NOT NULL,
  hotel_id INT NOT NULL,
  room_id INT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id),
  CONSTRAINT fk_hotel_rooms_owner FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rooms_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT unique_hotel_room_combination UNIQUE (hotel_id, room_id)
);

-- Create hotels_seasons table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotels_seasons (
  id SERIAL NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  season_name VARCHAR NOT NULL,
  hotel_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_hotels_seasons_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CONSTRAINT hotel_seasons UNIQUE (start_date, end_date, hotel_id)
);

-- Create hotel_meal_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_meal_plans (
  id SERIAL NOT NULL,
  meal_plan_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT unique_meal_plan_name UNIQUE (meal_plan_name)
);

-- Create hotel_rates_option table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_rates_option (
  id SERIAL NOT NULL,
  option_name VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT unique_rates_option_name UNIQUE (option_name)
);

-- Create hotel_child_policy table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_child_policy (
  id SERIAL NOT NULL,
  policy_name VARCHAR NOT NULL,
  min_age INT,
  max_age INT,
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT unique_child_policy_name UNIQUE (policy_name)
);

-- Create hotel_pricing_type table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_pricing_type (
  id SERIAL NOT NULL,
  name VARCHAR NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_pricing_type_name UNIQUE (name)
);

-- Create hotel_rates table if it doesn't exist
CREATE TABLE IF NOT EXISTS hotel_rates (
  id SERIAL NOT NULL,
  hotel_id INT NOT NULL,
  hotel_room_id INT NOT NULL,
  rate REAL,
  meal_plan_id INT NOT NULL,
  tax_behavior INT NOT NULL,
  hotel_season_id INT NOT NULL,
  hotel_rates_option_id INT NOT NULL,
  currency_id INT NOT NULL,
  entry_type_id INT,
  hotel_pricing_type_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_hotel_rates_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_hotel_room FOREIGN KEY (hotel_room_id) REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES hotel_meal_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_tax_behavior FOREIGN KEY (tax_behavior) REFERENCES tax_behaviour(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_hotel_season FOREIGN KEY (hotel_season_id) REFERENCES hotels_seasons(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_option FOREIGN KEY (hotel_rates_option_id) REFERENCES hotel_rates_option(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_currency FOREIGN KEY (currency_id) REFERENCES currency(id) ON DELETE CASCADE,
  CONSTRAINT fk_hotel_rates_entry_type FOREIGN KEY (entry_type_id) REFERENCES entry_type(id) ON DELETE SET NULL,
  CONSTRAINT fk_hotel_rates_pricing_type FOREIGN KEY (hotel_pricing_type_id) REFERENCES hotel_pricing_type(id) ON DELETE CASCADE,
  CONSTRAINT unique_hotel_rate_combination UNIQUE (hotel_id, hotel_room_id, meal_plan_id, hotel_rates_option_id, entry_type_id, hotel_pricing_type_id)
);

-- Drop the existing function if it exists to recreate it properly
DROP FUNCTION IF EXISTS check_room_name_exists(VARCHAR);

-- Create the check_room_name_exists function
CREATE OR REPLACE FUNCTION check_room_name_exists(room_name_input VARCHAR)
RETURNS TABLE (
  exists_globally BOOLEAN,
  exists_in_company BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Check if room name exists globally
  SELECT EXISTS(
    SELECT 1 FROM rooms WHERE LOWER(room_name) = LOWER(room_name_input)
  ) INTO exists_globally;
  
  -- Check if room name exists in current user's company
  SELECT EXISTS(
    SELECT 1 FROM rooms r
    JOIN companies c ON r.owner_id = c.id
    WHERE LOWER(r.room_name) = LOWER(room_name_input)
    AND c.owner_id = auth.uid()
  ) INTO exists_in_company;
  
  -- Generate appropriate message
  IF exists_in_company THEN
    message := 'A room with this name already exists in your company.';
  ELSIF exists_globally THEN
    message := 'A room with this name already exists in another company. You can still create it if needed.';
  ELSE
    message := 'Room name is available.';
  END IF;
  
  RETURN QUERY SELECT exists_globally, exists_in_company, message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rates_option ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_child_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_pricing_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotels table
DROP POLICY IF EXISTS "Users can view own hotels" ON hotels;
CREATE POLICY "Users can view own hotels" ON hotels
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own hotels" ON hotels;
CREATE POLICY "Users can insert own hotels" ON hotels
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own hotels" ON hotels;
CREATE POLICY "Users can update own hotels" ON hotels
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own hotels" ON hotels;
CREATE POLICY "Users can delete own hotels" ON hotels
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create RLS policies for rooms table
DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
CREATE POLICY "Users can view own rooms" ON rooms
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can check room names globally" ON rooms;
CREATE POLICY "Users can check room names globally" ON rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own rooms" ON rooms;
CREATE POLICY "Users can insert own rooms" ON rooms
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own rooms" ON rooms;
CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create RLS policies for hotel_rooms table
DROP POLICY IF EXISTS "Users can view own hotel rooms" ON hotel_rooms;
CREATE POLICY "Users can view own hotel rooms" ON hotel_rooms
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own hotel rooms" ON hotel_rooms;
CREATE POLICY "Users can insert own hotel rooms" ON hotel_rooms
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own hotel rooms" ON hotel_rooms;
CREATE POLICY "Users can update own hotel rooms" ON hotel_rooms
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own hotel rooms" ON hotel_rooms;
CREATE POLICY "Users can delete own hotel rooms" ON hotel_rooms
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create RLS policies for hotels_seasons table
DROP POLICY IF EXISTS "Users can view own hotel seasons" ON hotels_seasons;
CREATE POLICY "Users can view own hotel seasons" ON hotels_seasons
  FOR SELECT USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert own hotel seasons" ON hotels_seasons;
CREATE POLICY "Users can insert own hotel seasons" ON hotels_seasons
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own hotel seasons" ON hotels_seasons;
CREATE POLICY "Users can update own hotel seasons" ON hotels_seasons
  FOR UPDATE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own hotel seasons" ON hotels_seasons;
CREATE POLICY "Users can delete own hotel seasons" ON hotels_seasons
  FOR DELETE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Create RLS policies for hotel_rates table
DROP POLICY IF EXISTS "Users can view own hotel rates" ON hotel_rates;
CREATE POLICY "Users can view own hotel rates" ON hotel_rates
  FOR SELECT USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert own hotel rates" ON hotel_rates;
CREATE POLICY "Users can insert own hotel rates" ON hotel_rates
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own hotel rates" ON hotel_rates;
CREATE POLICY "Users can update own hotel rates" ON hotel_rates
  FOR UPDATE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own hotel rates" ON hotel_rates;
CREATE POLICY "Users can delete own hotel rates" ON hotel_rates
  FOR DELETE USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE owner_id IN (
        SELECT id FROM companies WHERE owner_id = auth.uid()
      )
    )
  );

-- Create RLS policies for reference tables (allow all authenticated users to read)
DROP POLICY IF EXISTS "Users can view all meal plans" ON hotel_meal_plans;
CREATE POLICY "Users can view all meal plans" ON hotel_meal_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all rates options" ON hotel_rates_option;
CREATE POLICY "Users can view all rates options" ON hotel_rates_option
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all child policies" ON hotel_child_policy;
CREATE POLICY "Users can view all child policies" ON hotel_child_policy
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all pricing types" ON hotel_pricing_type;
CREATE POLICY "Users can view all pricing types" ON hotel_pricing_type
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all hotel categories" ON hotel_category;
CREATE POLICY "Users can view all hotel categories" ON hotel_category
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view all locations" ON locations;
CREATE POLICY "Users can view all locations" ON locations
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_owner_id ON hotel_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_room_id ON hotel_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_hotels_seasons_hotel_id ON hotels_seasons(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_id ON hotel_rates(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_room_id ON hotel_rates(hotel_room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_meal_plan_id ON hotel_rates(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_season_id ON hotel_rates(hotel_season_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_option_id ON hotel_rates(hotel_rates_option_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_currency_id ON hotel_rates(currency_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_entry_type_id ON hotel_rates(entry_type_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_pricing_type_id ON hotel_rates(hotel_pricing_type_id);
CREATE INDEX IF NOT EXISTS idx_hotel_pricing_type_name ON hotel_pricing_type(name); 