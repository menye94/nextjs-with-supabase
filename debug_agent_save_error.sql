-- Debug script to identify agent save issues
-- Run this to check the current database state

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

-- Check if countries table exists and has data
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'countries'
ORDER BY ordinal_position;

-- Check countries data count
SELECT COUNT(*) as countries_count FROM countries;

-- Check if there are any existing agents
SELECT COUNT(*) as agents_count FROM agents;

-- Check for any constraint violations
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'agents'::regclass;

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

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'agents'
ORDER BY trigger_name;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%agent%'
ORDER BY routine_name;

-- Test inserting a sample agent to see what happens
DO $$
DECLARE
    test_company_id UUID;
    test_country_id INTEGER;
    test_agent_code VARCHAR;
    insert_result RECORD;
BEGIN
    -- Get a test company
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    -- Get a test country
    SELECT id INTO test_country_id FROM countries LIMIT 1;
    
    -- Generate a test agent code
    test_agent_code := 'TEST' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    RAISE NOTICE 'Testing with company_id: %, country_id: %, agent_code: %', test_company_id, test_country_id, test_agent_code;
    
    -- Try to insert a test agent
    INSERT INTO agents (agent_code, agent_email, agent_name, agent_is_active, country_id, owner_id)
    VALUES (test_agent_code, 'test@example.com', 'Test Agent', true, test_country_id, test_company_id)
    RETURNING * INTO insert_result;
    
    RAISE NOTICE 'Test insert successful: %', insert_result;
    
    -- Clean up test data
    DELETE FROM agents WHERE agent_code = test_agent_code;
    
    RAISE NOTICE 'Test completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- Display diagnostic information
DO $$
BEGIN
    RAISE NOTICE '=== AGENT SAVE ERROR DIAGNOSTIC ===';
    RAISE NOTICE 'Check the above results for:';
    RAISE NOTICE '1. Missing tables or columns';
    RAISE NOTICE '2. Incorrect data types';
    RAISE NOTICE '3. Missing triggers or functions';
    RAISE NOTICE '4. RLS policy issues';
    RAISE NOTICE '5. Constraint violations';
    RAISE NOTICE '6. Empty tables that might cause issues';
    RAISE NOTICE '7. Test insert results';
END $$; 