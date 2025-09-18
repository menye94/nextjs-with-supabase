-- Update hotels table in Supabase
-- This script adds missing foreign key constraints and ensures proper table structure

-- First, let's check if the hotels table exists and its current structure
-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL NOT NULL,
  hotel_name VARCHAR NOT NULL,
  company_id UUID NOT NULL,
  location_id INT NOT NULL,
  category_id INT NOT NULL,
  is_partner BOOLEAN,
  is_active BOOLEAN,
  contact_email VARCHAR,
  hotel_website VARCHAR,
  is_deleted TIMESTAMPTZ,
  PRIMARY KEY (id)
);

-- Add foreign key constraints if they don't exist
-- Note: We'll use IF NOT EXISTS pattern to avoid errors if constraints already exist

-- Add foreign key for company_id (companies table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_hotels_company' 
    AND table_name = 'hotels'
  ) THEN
    ALTER TABLE hotels ADD CONSTRAINT fk_hotels_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);
  END IF;
END $$;

-- Add foreign key for location_id (locations table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_hotels_location' 
    AND table_name = 'hotels'
  ) THEN
    ALTER TABLE hotels ADD CONSTRAINT fk_hotels_location 
    FOREIGN KEY (location_id) REFERENCES locations(id);
  END IF;
END $$;

-- Add foreign key for category_id (hotel_category table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_hotels_category' 
    AND table_name = 'hotels'
  ) THEN
    ALTER TABLE hotels ADD CONSTRAINT fk_hotels_category 
    FOREIGN KEY (category_id) REFERENCES hotel_category(id);
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'hotels' 
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'hotels'; 