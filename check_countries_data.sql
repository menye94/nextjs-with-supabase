-- Check if countries table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'countries'
) as table_exists;

-- Check countries table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'countries'
ORDER BY ordinal_position;

-- Check if countries table has data
SELECT COUNT(*) as total_countries FROM countries;

-- Show first 10 countries
SELECT id, country_name, code FROM countries ORDER BY country_name LIMIT 10;

-- Check RLS policies on countries table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'countries'; 