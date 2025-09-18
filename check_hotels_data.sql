-- Check and Fix Hotel Data for Seasons
-- This script checks if hotels exist and adds sample data if needed

-- First, let's check if the hotels table exists and has data
SELECT 'Checking hotels table...' as status;

-- Check if hotels table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hotels'
) as hotels_table_exists;

-- Check if there are any hotels in the table
SELECT COUNT(*) as hotel_count FROM hotels;

-- Check if there are any seasons in the table
SELECT COUNT(*) as season_count FROM hotels_seasons;

-- Check the structure of hotels table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hotels' 
ORDER BY ordinal_position;

-- Check the structure of hotels_seasons table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'hotels_seasons' 
ORDER BY ordinal_position;

-- Check foreign key constraints
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
  AND tc.table_name = 'hotels_seasons';

-- If no hotels exist, let's add some sample hotels
-- First, check if we need to create the hotels table
DO $$
BEGIN
  -- Create hotels table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hotels') THEN
    CREATE TABLE hotels (
      id SERIAL PRIMARY KEY,
      hotel_name VARCHAR NOT NULL,
      owner_id UUID NOT NULL,
      location_id INT,
      category_id INT,
      camping_type_id INT,
      is_partner BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      contact_email VARCHAR,
      hotel_website VARCHAR,
      is_deleted TIMESTAMPTZ,
      CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE
    );
    
    -- Enable RLS
    ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
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
      
    RAISE NOTICE 'Created hotels table';
  END IF;
END $$;

-- Add sample hotels if none exist
DO $$
DECLARE
  user_company_id UUID;
  hotel_count INTEGER;
BEGIN
  -- Get the first company ID (for demo purposes)
  SELECT id INTO user_company_id FROM companies LIMIT 1;
  
  -- Check if we have any hotels
  SELECT COUNT(*) INTO hotel_count FROM hotels;
  
  IF hotel_count = 0 AND user_company_id IS NOT NULL THEN
    -- Insert sample hotels
    INSERT INTO hotels (hotel_name, owner_id, is_active) VALUES
      ('Grand Hotel & Spa', user_company_id, true),
      ('Seaside Resort', user_company_id, true),
      ('Mountain Lodge', user_company_id, true),
      ('City Center Hotel', user_company_id, true),
      ('Beachfront Resort', user_company_id, true);
      
    RAISE NOTICE 'Added 5 sample hotels';
  ELSE
    RAISE NOTICE 'Hotels already exist or no company found';
  END IF;
END $$;

-- Check the final state
SELECT 'Final check...' as status;
SELECT COUNT(*) as final_hotel_count FROM hotels;
SELECT COUNT(*) as final_season_count FROM hotels_seasons;

-- Show sample hotels
SELECT id, hotel_name, is_active FROM hotels LIMIT 10;

-- Show sample seasons with hotel names
SELECT 
  hs.id,
  hs.season_name,
  hs.start_date,
  hs.end_date,
  h.hotel_name,
  hs.hotel_id
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id
LIMIT 10; 