-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL NOT NULL,
  country_name VARCHAR NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT unique_country_name UNIQUE (country_name)
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
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_deleted TIMESTAMPTZ,
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