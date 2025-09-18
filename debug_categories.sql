-- Debug script to check equipment categories data
-- Run this in your Supabase SQL Editor to see what's in the equipment_categories table

-- Check all equipment categories with their raw data
SELECT 
    id,
    name,
    is_active,
    owner_id,
    created_at,
    updated_at
FROM equipment_categories
ORDER BY created_at DESC;

-- Check if there are any categories with null or empty names
SELECT 
    id,
    name,
    CASE 
        WHEN name IS NULL THEN 'NULL'
        WHEN name = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE'
    END as name_status,
    is_active,
    owner_id
FROM equipment_categories
ORDER BY created_at DESC;

-- Check the join with companies table
SELECT 
    ec.id,
    ec.name as category_name,
    ec.is_active,
    ec.owner_id,
    c.company_name as owner_company_name
FROM equipment_categories ec
LEFT JOIN companies c ON ec.owner_id = c.id
ORDER BY ec.created_at DESC;

-- Count total categories
SELECT COUNT(*) as total_categories FROM equipment_categories;

-- Check for any categories with non-null names
SELECT COUNT(*) as categories_with_names 
FROM equipment_categories 
WHERE name IS NOT NULL AND name != ''; 