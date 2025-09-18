-- Fix equipment_company table foreign key issues
-- This script addresses the missing cities table reference

-- Option 1: Create cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL NOT NULL,
  city_name VARCHAR NOT NULL,
  country_id INT,
  PRIMARY KEY (id)
);

-- Option 2: Drop the problematic foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_equipment_company_city' 
        AND table_name = 'equipment_company'
    ) THEN
        ALTER TABLE equipment_company 
        DROP CONSTRAINT fk_equipment_company_city;
        RAISE NOTICE 'Dropped fk_equipment_company_city constraint';
    ELSE
        RAISE NOTICE 'fk_equipment_company_city constraint does not exist';
    END IF;
END $$;

-- Option 3: Update equipment_company table to remove city_id requirement
-- First, check if city_id column exists and has data
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment_company' 
        AND column_name = 'city_id'
    ) THEN
        -- Make city_id nullable if it's not already
        ALTER TABLE equipment_company 
        ALTER COLUMN city_id DROP NOT NULL;
        
        RAISE NOTICE 'Made city_id column nullable';
    ELSE
        RAISE NOTICE 'city_id column does not exist in equipment_company table';
    END IF;
END $$;

-- Success message
SELECT 'Equipment company foreign key issues resolved!' as status; 