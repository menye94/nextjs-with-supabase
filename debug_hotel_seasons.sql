-- Debug Hotel Seasons - Find why hotel names are showing as "Unknown Hotel"
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if hotels table exists and has data
SELECT '=== HOTELS TABLE CHECK ===' as section;
SELECT COUNT(*) as total_hotels FROM hotels;
SELECT id, hotel_name, is_active FROM hotels LIMIT 5;

-- 2. Check if hotels_seasons table exists and has data
SELECT '=== HOTELS_SEASONS TABLE CHECK ===' as section;
SELECT COUNT(*) as total_seasons FROM hotels_seasons;
SELECT id, season_name, hotel_id, start_date, end_date FROM hotels_seasons LIMIT 5;

-- 3. Check the foreign key relationship
SELECT '=== FOREIGN KEY CHECK ===' as section;
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

-- 4. Check for orphaned seasons (seasons with hotel_id that don't exist in hotels table)
SELECT '=== ORPHANED SEASONS CHECK ===' as section;
SELECT 
  hs.id,
  hs.season_name,
  hs.hotel_id,
  CASE 
    WHEN h.id IS NULL THEN 'MISSING HOTEL'
    ELSE 'HOTEL EXISTS'
  END as hotel_status
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id
WHERE h.id IS NULL;

-- 5. Test the exact query that the frontend uses
SELECT '=== FRONTEND QUERY TEST ===' as section;
SELECT 
  hs.id,
  hs.start_date,
  hs.end_date,
  hs.season_name,
  hs.hotel_id,
  h.hotel_name,
  CASE 
    WHEN h.hotel_name IS NULL THEN 'NULL HOTEL NAME'
    ELSE 'HOTEL NAME EXISTS'
  END as hotel_name_status
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id
LIMIT 10;

-- 6. Check RLS policies on hotels table
SELECT '=== RLS POLICIES CHECK ===' as section;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'hotels';

-- 7. Test if current user can access hotels
SELECT '=== USER ACCESS TEST ===' as section;
SELECT 
  auth.uid() as current_user_id,
  COUNT(*) as accessible_hotels
FROM hotels;

-- 8. Check if there are any hotels for the current user's company
SELECT '=== USER COMPANY HOTELS ===' as section;
SELECT 
  c.id as company_id,
  c.company_name,
  COUNT(h.id) as hotel_count
FROM companies c
LEFT JOIN hotels h ON c.id = h.owner_id
WHERE c.owner_id = auth.uid()
GROUP BY c.id, c.company_name;

-- 9. Show sample data with proper joins
SELECT '=== SAMPLE DATA WITH JOINS ===' as section;
SELECT 
  hs.id as season_id,
  hs.season_name,
  hs.hotel_id,
  h.hotel_name,
  h.owner_id as hotel_owner_id,
  c.owner_id as company_owner_id,
  auth.uid() as current_user
FROM hotels_seasons hs
LEFT JOIN hotels h ON hs.hotel_id = h.id
LEFT JOIN companies c ON h.owner_id = c.id
LIMIT 10; 