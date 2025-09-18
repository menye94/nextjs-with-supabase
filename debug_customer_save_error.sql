-- Debug script to identify customer save issues
-- Run this to check the current database state

-- Check if customers table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Check if agents table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'agents'
ORDER BY ordinal_position;

-- Check if clients table exists and has correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('customers', 'agents', 'clients')
ORDER BY event_object_table, trigger_name;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%client%'
ORDER BY routine_name;

-- Check RLS policies on customers table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'customers';

-- Check RLS policies on agents table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'agents';

-- Check RLS policies on clients table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clients';

-- Check if there are any existing customers
SELECT COUNT(*) as customer_count FROM customers;

-- Check if there are any existing agents
SELECT COUNT(*) as agent_count FROM agents;

-- Check if there are any existing client relationships
SELECT COUNT(*) as client_relationship_count FROM clients;

-- Check for any constraint violations
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'customers'::regclass
   OR conrelid = 'agents'::regclass
   OR conrelid = 'clients'::regclass;

-- Display diagnostic information
DO $$
BEGIN
    RAISE NOTICE '=== CUSTOMER SAVE ERROR DIAGNOSTIC ===';
    RAISE NOTICE 'Check the above results for:';
    RAISE NOTICE '1. Missing tables or columns';
    RAISE NOTICE '2. Incorrect data types';
    RAISE NOTICE '3. Missing triggers or functions';
    RAISE NOTICE '4. RLS policy issues';
    RAISE NOTICE '5. Constraint violations';
    RAISE NOTICE '6. Empty tables that might cause trigger issues';
END $$; 