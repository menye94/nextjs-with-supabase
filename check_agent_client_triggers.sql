-- Check if agent-client triggers are properly set up
-- This script verifies the trigger configuration

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('customers', 'agents')
AND trigger_name LIKE '%client%'
ORDER BY event_object_table, trigger_name;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%client%'
ORDER BY routine_name;

-- Check current data counts
SELECT 
    'customers' as table_name,
    COUNT(*) as count
FROM customers
UNION ALL
SELECT 
    'agents' as table_name,
    COUNT(*) as count
FROM agents
UNION ALL
SELECT 
    'clients' as table_name,
    COUNT(*) as count
FROM clients;

-- Check if there are any existing client relationships
SELECT 
    c.id as client_id,
    cust.cus_first_name || ' ' || cust.cus_last_name as customer_name,
    a.agent_name as agent_name,
    c.created_at
FROM clients c
JOIN customers cust ON c.customer_id = cust.id
JOIN agents a ON c.agent_id = a.id
ORDER BY c.created_at DESC
LIMIT 5;

-- Test the trigger function directly
DO $$
DECLARE
    test_company_id UUID;
    test_customer_id INTEGER;
    test_agent_id INTEGER;
    result_count INTEGER;
BEGIN
    -- Get a test company
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NULL THEN
        RAISE NOTICE 'No companies found in database.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing trigger function with company_id: %', test_company_id;
    
    -- Check if we have customers and agents
    SELECT COUNT(*) INTO result_count FROM customers WHERE owner_id = test_company_id;
    RAISE NOTICE 'Customers for company: %', result_count;
    
    SELECT COUNT(*) INTO result_count FROM agents WHERE owner_id = test_company_id;
    RAISE NOTICE 'Agents for company: %', result_count;
    
    SELECT COUNT(*) INTO result_count FROM clients c
    JOIN customers cust ON c.customer_id = cust.id
    WHERE cust.owner_id = test_company_id;
    RAISE NOTICE 'Existing client relationships: %', result_count;
    
    -- Check if triggers are working by looking at the expected relationships
    SELECT COUNT(*) INTO result_count 
    FROM customers c
    CROSS JOIN agents a
    WHERE c.owner_id = test_company_id 
    AND a.owner_id = test_company_id;
    RAISE NOTICE 'Expected client relationships (customers × agents): %', result_count;
    
END $$; 