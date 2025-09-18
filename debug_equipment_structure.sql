-- Diagnostic script to understand the current equipment table structure

-- Check the structure of equipments table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipments' 
ORDER BY ordinal_position;

-- Check the structure of equipment_company table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'equipment_company' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('equipments', 'equipment_company');

-- Check sample data from equipments table
SELECT * FROM equipments LIMIT 3;

-- Check sample data from equipment_company table
SELECT * FROM equipment_company LIMIT 3; 