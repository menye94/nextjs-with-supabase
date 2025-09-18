-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL NOT NULL,
  country_name VARCHAR NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_country_name UNIQUE (country_name)
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL NOT NULL,
  city_name VARCHAR NOT NULL,
  country_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_city_name UNIQUE (country_id, city_name),
  CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Create national_park_circuit table
CREATE TABLE IF NOT EXISTS national_park_circuit (
  id SERIAL NOT NULL,
  national_park_circuit_name VARCHAR NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_park_circuit_name UNIQUE (national_park_circuit_name)
);

-- Create national_parks table
CREATE TABLE IF NOT EXISTS national_parks (
  id SERIAL NOT NULL,
  national_park_name VARCHAR,
  is_active BOOLEAN,
  country_id INT NOT NULL,
  park_circuit_id INT NOT NULL,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id),
  CONSTRAINT unique_park_name UNIQUE (national_park_name),
  CONSTRAINT fk_national_parks_country FOREIGN KEY (country_id) REFERENCES countries(id),
  CONSTRAINT fk_national_parks_circuit FOREIGN KEY (park_circuit_id) REFERENCES national_park_circuit(id)
);

-- Create entry_type table
CREATE TABLE IF NOT EXISTS entry_type (
  id SERIAL NOT NULL,
  entry_name VARCHAR NOT NULL,
  is_active BOOLEAN,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id)
);

-- Create tax_behaviour table
CREATE TABLE IF NOT EXISTS tax_behaviour (
  id SERIAL NOT NULL,
  name VARCHAR NOT NULL,
  PRIMARY KEY (id)
);

-- Create park_category table
CREATE TABLE IF NOT EXISTS park_category (
  id SERIAL NOT NULL,
  category_name VARCHAR NOT NULL,
  is_active BOOLEAN,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id)
);

-- Create camping_type table
CREATE TABLE IF NOT EXISTS camping_type (
  id SERIAL NOT NULL,
  name VARCHAR NOT NULL,
  is_active BOOLEAN,
  PRIMARY KEY (id),
  CONSTRAINT unique_camping_type_name UNIQUE (name)
);

-- Create currency table
CREATE TABLE IF NOT EXISTS currency (
  id SERIAL NOT NULL,
  currency_name VARCHAR NOT NULL,
  PRIMARY KEY (id)
);

-- Create pricing_type table
CREATE TABLE IF NOT EXISTS pricing_type (
  id SERIAL NOT NULL,
  pricing_type_name VARCHAR NOT NULL,
  PRIMARY KEY (id)
);

-- Create age_group table
CREATE TABLE IF NOT EXISTS age_group (
  id SERIAL NOT NULL,
  age_group_name VARCHAR NOT NULL,
  min_age INT NOT NULL,
  max_age INT NOT NULL,
  PRIMARY KEY (id)
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL NOT NULL,
  season_name VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_season_name UNIQUE (season_name)
);

-- Create park_product table
CREATE TABLE IF NOT EXISTS park_product (
  id SERIAL NOT NULL,
  age_group INT NOT NULL,
  national_park_id INT NOT NULL,
  entry_type_id INT NOT NULL,
  pricing_type_id INT NOT NULL,
  product_name VARCHAR NOT NULL,
  park_category_id INT,
  PRIMARY KEY (id),
  CONSTRAINT unique_park_product UNIQUE (national_park_id, entry_type_id, age_group, park_category_id, pricing_type_id),
  CONSTRAINT fk_park_product_age_group FOREIGN KEY (age_group) REFERENCES age_group(id),
  CONSTRAINT fk_park_product_national_park FOREIGN KEY (national_park_id) REFERENCES national_parks(id),
  CONSTRAINT fk_park_product_entry_type FOREIGN KEY (entry_type_id) REFERENCES entry_type(id),
  CONSTRAINT fk_park_product_pricing_type FOREIGN KEY (pricing_type_id) REFERENCES pricing_type(id),
  CONSTRAINT fk_park_product_park_category FOREIGN KEY (park_category_id) REFERENCES park_category(id)
);

-- Create park_product_price table
CREATE TABLE IF NOT EXISTS park_product_price (
  id SERIAL NOT NULL,
  park_product_id INT NOT NULL,
  season_id INT NOT NULL,
  tax_behavior INT NOT NULL,
  currency_id INT NOT NULL,
  unit_amount REAL,
  PRIMARY KEY (id),
  CONSTRAINT unique_park_product_price UNIQUE (park_product_id, season_id),
  CONSTRAINT fk_park_product_price_product FOREIGN KEY (park_product_id) REFERENCES park_product(id),
  CONSTRAINT fk_park_product_price_season FOREIGN KEY (season_id) REFERENCES seasons(id),
  CONSTRAINT fk_park_product_price_tax_behavior FOREIGN KEY (tax_behavior) REFERENCES tax_behaviour(id),
  CONSTRAINT fk_park_product_price_currency FOREIGN KEY (currency_id) REFERENCES currency(id)
);

-- Create camping_products table
CREATE TABLE IF NOT EXISTS camping_products (
  id SERIAL NOT NULL,
  camping_type_id INT NOT NULL,
  entry_type_id INT NOT NULL,
  national_park_id INT NOT NULL,
  age_group_id INT NOT NULL,
  product_name VARCHAR,
  is_active BOOLEAN,
  pricing_type_id INT NOT NULL,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id),
  CONSTRAINT fk_camping_products_camping_type FOREIGN KEY (camping_type_id) REFERENCES camping_type(id),
  CONSTRAINT fk_camping_products_entry_type FOREIGN KEY (entry_type_id) REFERENCES entry_type(id),
  CONSTRAINT fk_camping_products_national_park FOREIGN KEY (national_park_id) REFERENCES national_parks(id),
  CONSTRAINT fk_camping_products_age_group FOREIGN KEY (age_group_id) REFERENCES age_group(id),
  CONSTRAINT fk_camping_products_pricing_type FOREIGN KEY (pricing_type_id) REFERENCES pricing_type(id)
);

-- Create camping_products_price table
CREATE TABLE IF NOT EXISTS camping_products_price (
  id SERIAL NOT NULL,
  camping_product_id INT NOT NULL,
  season_id INT NOT NULL,
  tax_behavior INT NOT NULL,
  currency_id INT NOT NULL,
  unit_amount REAL,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id),
  CONSTRAINT unique_camping_product_price UNIQUE (camping_product_id, season_id),
  CONSTRAINT fk_camping_products_price_product FOREIGN KEY (camping_product_id) REFERENCES camping_products(id),
  CONSTRAINT fk_camping_products_price_season FOREIGN KEY (season_id) REFERENCES seasons(id),
  CONSTRAINT fk_camping_products_price_tax_behavior FOREIGN KEY (tax_behavior) REFERENCES tax_behaviour(id),
  CONSTRAINT fk_camping_products_price_currency FOREIGN KEY (currency_id) REFERENCES currency(id)
);

-- Create hotel_category table
CREATE TABLE IF NOT EXISTS hotel_category (
  id SERIAL NOT NULL,
  name VARCHAR NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_hotel_category_name UNIQUE (name)
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL NOT NULL,
  city_id INT,
  national_park_id INT,
  PRIMARY KEY (id),
  CONSTRAINT unique_park UNIQUE (national_park_id),
  CONSTRAINT unique_city UNIQUE (city_id)
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL NOT NULL,
  hotel_name VARCHAR NOT NULL,
  owner_id UUID NOT NULL,
  location_id INT NOT NULL,
  category_id INT NOT NULL,
  camping_type_id INT,
  is_partner BOOLEAN,
  is_active BOOLEAN,
  contact_email VARCHAR,
  hotel_website VARCHAR,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id),
  CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES companies(id),
           CONSTRAINT fk_hotels_location FOREIGN KEY (location_id) REFERENCES locations(id),
         CONSTRAINT fk_hotels_category FOREIGN KEY (category_id) REFERENCES hotel_category(id),
         CONSTRAINT fk_hotels_camping_type FOREIGN KEY (camping_type_id) REFERENCES camping_type(id)
);

-- Create rooms table
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

-- Create hotel_rooms junction table
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

-- Create hotels_seasons table
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

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  phone_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (auth.uid() = owner_id);

-- Create policy to allow users to insert their own company
CREATE POLICY "Users can insert own company" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Create policy to allow users to update their own company
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create policy to allow users to delete their own company
CREATE POLICY "Users can delete own company" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- Create function to automatically create company record for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO companies (owner_id, company_name, company_email, company_address, phone_number)
  VALUES (NEW.id, NULL, NULL, NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create company record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check for existing room names and provide feedback
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

-- Enable RLS on hotels table
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- Create policies for hotels table
CREATE POLICY "Users can view own hotels" ON hotels
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own hotels" ON hotels
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own hotels" ON hotels
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own hotels" ON hotels
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
CREATE POLICY "Users can view own rooms" ON rooms
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Allow users to check for existing room names globally (for duplicate checking)
CREATE POLICY "Users can check room names globally" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own rooms" ON rooms
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Enable RLS on hotel_rooms table
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_rooms table
CREATE POLICY "Users can view own hotel rooms" ON hotel_rooms
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own hotel rooms" ON hotel_rooms
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own hotel rooms" ON hotel_rooms
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own hotel rooms" ON hotel_rooms
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Enable RLS on hotels_seasons table
ALTER TABLE hotels_seasons ENABLE ROW LEVEL SECURITY;

-- Create policies for hotels_seasons table
CREATE POLICY "Users can view own hotel seasons" ON hotels_seasons
  FOR SELECT USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own hotel seasons" ON hotels_seasons
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own hotel seasons" ON hotels_seasons
  FOR UPDATE USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own hotel seasons" ON hotels_seasons
  FOR DELETE USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Create hotel_meal_plans table
CREATE TABLE IF NOT EXISTS hotel_meal_plans (
	id serial NOT NULL,
	name varchar NOT NULL,
	meal_plan_abbr varchar,
	PRIMARY KEY (id),
	CONSTRAINT unique_name UNIQUE (name)
);

-- Create hotel_rates_option table
CREATE TABLE IF NOT EXISTS hotel_rates_option (
	id serial NOT NULL,
	option_name varchar NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT unique_option_name UNIQUE (option_name)
);

-- Create hotel_child_policy table
CREATE TABLE IF NOT EXISTS hotel_child_policy (
	id serial NOT NULL,
	hotel_id INT NOT NULL,
	min_age INT NOT NULL,
	max_age INT NOT NULL,
	fee_percentage DECIMAL(5,2) NOT NULL,
	adult_sharing BOOLEAN DEFAULT false,
	PRIMARY KEY (id),
	CONSTRAINT fk_hotel_child_policy_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
	CONSTRAINT unique_hotel_age_range_sharing UNIQUE (hotel_id, min_age, max_age, adult_sharing)
);

-- Enable RLS on hotel_meal_plans table
ALTER TABLE hotel_meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_meal_plans table
CREATE POLICY "Users can view all meal plans" ON hotel_meal_plans
  FOR SELECT USING (true);

CREATE POLICY "Users can insert meal plans" ON hotel_meal_plans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update meal plans" ON hotel_meal_plans
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete meal plans" ON hotel_meal_plans
  FOR DELETE USING (true);

-- Enable RLS on hotel_rates_option table
ALTER TABLE hotel_rates_option ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_rates_option table
CREATE POLICY "Users can view all rates options" ON hotel_rates_option
  FOR SELECT USING (true);

CREATE POLICY "Users can insert rates options" ON hotel_rates_option
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update rates options" ON hotel_rates_option
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete rates options" ON hotel_rates_option
  FOR DELETE USING (true);

-- Enable RLS on hotel_child_policy table
ALTER TABLE hotel_child_policy ENABLE ROW LEVEL SECURITY;

-- Create policies for hotel_child_policy table
CREATE POLICY "Users can view own hotel child policies" ON hotel_child_policy
  FOR SELECT USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own hotel child policies" ON hotel_child_policy
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own hotel child policies" ON hotel_child_policy
  FOR UPDATE USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own hotel child policies" ON hotel_child_policy
  FOR DELETE USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN companies c ON h.owner_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Create hotel_pricing_type table
CREATE TABLE IF NOT EXISTS hotel_pricing_type (
    id serial NOT NULL,
    name varchar NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT unique_pricing_type_name UNIQUE (name)
);

-- Create hotel_rates table
CREATE TABLE IF NOT EXISTS hotel_rates (
    id serial NOT NULL,
    hotel_id int NOT NULL,
    hotel_room_id int NOT NULL,
    rate real,
    meal_plan_id int NOT NULL,
    tax_behavior int NOT NULL,
    hotel_season_id int NOT NULL,
    hotel_rates_option_id int NOT NULL,
    currency_id int NOT NULL,
    entry_type_id int,
    hotel_pricing_type_id int NOT NULL,
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

-- Enable RLS on hotel_pricing_type table
ALTER TABLE hotel_pricing_type ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotel_pricing_type table
CREATE POLICY "Users can view all pricing types" ON hotel_pricing_type
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pricing types" ON hotel_pricing_type
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pricing types" ON hotel_pricing_type
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pricing types" ON hotel_pricing_type
    FOR DELETE USING (true);

-- Enable RLS on hotel_rates table
ALTER TABLE hotel_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotel_rates table
CREATE POLICY "Users can view own hotel rates" ON hotel_rates
    FOR SELECT USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own hotel rates" ON hotel_rates
    FOR INSERT WITH CHECK (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own hotel rates" ON hotel_rates
    FOR UPDATE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own hotel rates" ON hotel_rates
    FOR DELETE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

-- Create indexes for hotel_rates table
CREATE INDEX idx_hotel_pricing_type_name ON hotel_pricing_type(name);
CREATE INDEX idx_hotel_rates_hotel_id ON hotel_rates(hotel_id);
CREATE INDEX idx_hotel_rates_hotel_room_id ON hotel_rates(hotel_room_id);
CREATE INDEX idx_hotel_rates_meal_plan_id ON hotel_rates(meal_plan_id);
CREATE INDEX idx_hotel_rates_hotel_season_id ON hotel_rates(hotel_season_id);
CREATE INDEX idx_hotel_rates_option_id ON hotel_rates(hotel_rates_option_id);
CREATE INDEX idx_hotel_rates_currency_id ON hotel_rates(currency_id);
CREATE INDEX idx_hotel_rates_entry_type_id ON hotel_rates(entry_type_id);
CREATE INDEX idx_hotel_rates_pricing_type_id ON hotel_rates(hotel_pricing_type_id);