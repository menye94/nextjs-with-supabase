-- Test script to verify agent creation automatically creates client relationships
-- This script tests the trigger functionality

-- First, let's check the current state
DO $$
DECLARE
    test_company_id UUID;
    test_customer_id INTEGER;
    test_agent_id INTEGER;
    client_count_before INTEGER;
    client_count_after INTEGER;
    agent_count_before INTEGER;
    agent_count_after INTEGER;
BEGIN
    -- Get a test company
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NULL THEN
        RAISE NOTICE 'No companies found in database. Cannot run test.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with company_id: %', test_company_id;
    
    -- Check current counts
    SELECT COUNT(*) INTO client_count_before FROM clients;
    SELECT COUNT(*) INTO agent_count_before FROM agents WHERE owner_id = test_company_id;
    
    RAISE NOTICE 'Before test - Agents: %, Clients: %', agent_count_before, client_count_before;
    
    -- Check if there are existing customers for this company
    SELECT COUNT(*) INTO test_customer_id FROM customers WHERE owner_id = test_company_id;
    
    IF test_customer_id = 0 THEN
        RAISE NOTICE 'No customers found for company %. Creating a test customer first...', test_company_id;
        
        -- Create a test customer
        INSERT INTO customers (
            cus_first_name, 
            cus_last_name, 
            cus_email_address, 
            cus_is_active, 
            owner_id
        ) VALUES (
            'Test', 
            'Customer', 
            'test@example.com', 
            true, 
            test_company_id
        ) RETURNING id INTO test_customer_id;
        
        RAISE NOTICE 'Created test customer with ID: %', test_customer_id;
    ELSE
        RAISE NOTICE 'Found % existing customers for company %', test_customer_id, test_company_id;
    END IF;
    
    -- Create a test agent (this should trigger the client relationship creation)
    INSERT INTO agents (
        agent_code,
        agent_email,
        agent_name,
        agent_is_active,
        owner_id
    ) VALUES (
        'TEST' || EXTRACT(EPOCH FROM NOW())::INTEGER,
        'testagent@example.com',
        'Test Agent',
        true,
        test_company_id
    ) RETURNING id INTO test_agent_id;
    
    RAISE NOTICE 'Created test agent with ID: %', test_agent_id;
    
    -- Check counts after agent creation
    SELECT COUNT(*) INTO client_count_after FROM clients;
    SELECT COUNT(*) INTO agent_count_after FROM agents WHERE owner_id = test_company_id;
    
    RAISE NOTICE 'After test - Agents: %, Clients: %', agent_count_after, client_count_after;
    
    -- Check if client relationships were created
    SELECT COUNT(*) INTO client_count_after 
    FROM clients c
    JOIN customers cust ON c.customer_id = cust.id
    WHERE cust.owner_id = test_company_id;
    
    RAISE NOTICE 'Client relationships for company: %', client_count_after;
    
    -- Verify the specific relationship was created
    IF EXISTS (
        SELECT 1 FROM clients 
        WHERE customer_id = test_customer_id 
        AND agent_id = test_agent_id
    ) THEN
        RAISE NOTICE '✅ SUCCESS: Client relationship created between customer % and agent %', test_customer_id, test_agent_id;
    ELSE
        RAISE NOTICE '❌ FAILED: No client relationship found between customer % and agent %', test_customer_id, test_agent_id;
    END IF;
    
    -- Clean up test data
    DELETE FROM agents WHERE id = test_agent_id;
    DELETE FROM customers WHERE id = test_customer_id;
    
    RAISE NOTICE 'Test completed. Cleaned up test data.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- Display current trigger status
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

-- Show current client relationships
SELECT 
    c.id as client_id,
    cust.cus_first_name || ' ' || cust.cus_last_name as customer_name,
    a.agent_name as agent_name,
    c.created_at
FROM clients c
JOIN customers cust ON c.customer_id = cust.id
JOIN agents a ON c.agent_id = a.id
ORDER BY c.created_at DESC
LIMIT 10; 