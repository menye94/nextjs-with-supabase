-- Fix Hotel Seasons - Add hotels and link to existing seasons
-- Run this AFTER running the debug script to understand the issue

-- Step 1: Get your company ID
SELECT '=== GETTING COMPANY ID ===' as step;
SELECT id, company_name FROM companies WHERE owner_id = auth.uid() LIMIT 1;

-- Step 2: Add sample hotels if none exist (replace YOUR_COMPANY_ID with actual ID from step 1)
-- Uncomment and modify the following if you need to add hotels:

/*
DO $$
DECLARE
  user_company_id UUID;
  hotel_count INTEGER;
BEGIN
  -- Get your company ID (replace with actual ID from step 1)
  SELECT id INTO user_company_id FROM companies WHERE owner_id = auth.uid() LIMIT 1;
  
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
      
    RAISE NOTICE 'Added 5 sample hotels for company %', user_company_id;
  ELSE
    RAISE NOTICE 'Hotels already exist (%) or no company found', hotel_count;
  END IF;
END $$;
*/

-- Step 3: Link existing seasons to hotels (if seasons exist but no hotels)
-- Uncomment and modify if you have seasons but no hotels:

/*
-- First, create a hotel if none exist
DO $$
DECLARE
  user_company_id UUID;
  hotel_count INTEGER;
  new_hotel_id INTEGER;
BEGIN
  SELECT id INTO user_company_id FROM companies WHERE owner_id = auth.uid() LIMIT 1;
  SELECT COUNT(*) INTO hotel_count FROM hotels;
  
  IF hotel_count = 0 AND user_company_id IS NOT NULL THEN
    INSERT INTO hotels (hotel_name, owner_id, is_active) 
    VALUES ('Default Hotel', user_company_id, true)
    RETURNING id INTO new_hotel_id;
    
    -- Update all seasons to use this hotel
    UPDATE hotels_seasons 
    SET hotel_id = new_hotel_id
    WHERE hotel_id IS NULL OR hotel_id NOT IN (SELECT id FROM hotels);
    
    RAISE NOTICE 'Created default hotel and linked % seasons', (SELECT COUNT(*) FROM hotels_seasons WHERE hotel_id = new_hotel_id);
  END IF;
END $$;
*/

-- Step 4: Verify the fix
SELECT '=== VERIFICATION ===' as step;
SELECT 
  hs.id as season_id,
  hs.season_name,
  hs.hotel_id,
  h.hotel_name,
  CASE 
    WHEN h.hotel_name IS NULL THEN 'STILL MISSING'
    ELSE 'FIXED'
  END as status
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id
LIMIT 10;

-- Step 5: Show final count
SELECT 
  COUNT(*) as total_seasons,
  COUNT(h.id) as seasons_with_hotels,
  COUNT(*) - COUNT(h.id) as seasons_without_hotels
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id; 