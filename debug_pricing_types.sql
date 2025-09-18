-- Debug script to check pricing type names in the database
-- This will help us see the exact names that need abbreviations

-- Check all pricing types
SELECT 
    id,
    name,
    LOWER(name) as lower_name
FROM hotel_pricing_type
ORDER BY name;

-- Check how pricing types are used in hotel rates
SELECT 
    hr.id,
    hpt.name as pricing_type_name,
    LOWER(hpt.name) as lower_pricing_type_name
FROM hotel_rates hr
JOIN hotel_pricing_type hpt ON hr.hotel_pricing_type_id = hpt.id
ORDER BY hpt.name
LIMIT 20; 