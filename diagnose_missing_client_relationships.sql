-- Diagnose missing client relationships
-- This script identifies agents and customers that should have relationships but don't

-- First, check if triggers are actually active
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

-- Find agents that are missing from clients table
SELECT 
    a.id as agent_id,
    a.agent_name,
    a.agent_code,
    a.owner_id,
    COUNT(c.id) as customer_count,
    COUNT(cl.id) as client_relationship_count
FROM agents a
LEFT JOIN customers c ON c.owner_id = a.owner_id
LEFT JOIN clients cl ON cl.agent_id = a.id
GROUP BY a.id, a.agent_name, a.agent_code, a.owner_id
HAVING COUNT(c.id) > 0 AND COUNT(cl.id) = 0
ORDER BY a.agent_name;

-- Find customers that are missing from clients table
SELECT 
    c.id as customer_id,
    c.cus_first_name || ' ' || c.cus_last_name as customer_name,
    c.owner_id,
    COUNT(a.id) as agent_count,
    COUNT(cl.id) as client_relationship_count
FROM customers c
LEFT JOIN agents a ON a.owner_id = c.owner_id
LEFT JOIN clients cl ON cl.customer_id = c.id
GROUP BY c.id, c.cus_first_name, c.cus_last_name, c.owner_id
HAVING COUNT(a.id) > 0 AND COUNT(cl.id) = 0
ORDER BY customer_name;

-- Show expected vs actual relationships
DO $$
DECLARE
    company_id UUID;
    expected_relationships INTEGER;
    actual_relationships INTEGER;
    missing_relationships INTEGER;
BEGIN
    -- Check each company
    FOR company_id IN SELECT DISTINCT owner_id FROM companies LOOP
        -- Count expected relationships (customers × agents)
        SELECT COUNT(*) INTO expected_relationships
        FROM customers c
        CROSS JOIN agents a
        WHERE c.owner_id = company_id AND a.owner_id = company_id;
        
        -- Count actual relationships
        SELECT COUNT(*) INTO actual_relationships
        FROM clients cl
        JOIN customers c ON cl.customer_id = c.id
        WHERE c.owner_id = company_id;
        
        missing_relationships := expected_relationships - actual_relationships;
        
        RAISE NOTICE 'Company %: Expected: %, Actual: %, Missing: %', 
            company_id, expected_relationships, actual_relationships, missing_relationships;
    END LOOP;
END $$;

-- Show detailed breakdown by company
SELECT 
    comp.company_name,
    COUNT(DISTINCT cust.id) as customer_count,
    COUNT(DISTINCT ag.id) as agent_count,
    COUNT(cl.id) as client_relationship_count,
    (COUNT(DISTINCT cust.id) * COUNT(DISTINCT ag.id)) as expected_relationships,
    ((COUNT(DISTINCT cust.id) * COUNT(DISTINCT ag.id)) - COUNT(cl.id)) as missing_relationships
FROM companies comp
LEFT JOIN customers cust ON cust.owner_id = comp.id
LEFT JOIN agents ag ON ag.owner_id = comp.id
LEFT JOIN clients cl ON (cl.customer_id = cust.id OR cl.agent_id = ag.id)
GROUP BY comp.id, comp.company_name
ORDER BY missing_relationships DESC;

-- Check if there are any constraint violations preventing inserts
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'clients'::regclass;

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