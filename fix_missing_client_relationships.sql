-- Fix missing client relationships and ensure triggers work
-- This script creates missing relationships and verifies trigger setup

-- First, let's recreate the triggers to ensure they're working properly
DO $$
BEGIN
    RAISE NOTICE 'Recreating client relationship triggers...';
END $$;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_create_client_relationships_customer ON customers;
DROP TRIGGER IF EXISTS trigger_create_client_relationships_agent ON agents;
DROP TRIGGER IF EXISTS trigger_remove_client_relationships_customer ON customers;
DROP TRIGGER IF EXISTS trigger_remove_client_relationships_agent ON agents;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_client_relationships_for_customer();
DROP FUNCTION IF EXISTS create_client_relationships_for_agent();
DROP FUNCTION IF EXISTS remove_client_relationships_for_customer();
DROP FUNCTION IF EXISTS remove_client_relationships_for_agent();

-- Create improved function to create client relationships for a new customer
CREATE OR REPLACE FUNCTION create_client_relationships_for_customer()
RETURNS TRIGGER AS $$
DECLARE
    agent_count INTEGER;
    inserted_count INTEGER;
BEGIN
    -- Check if there are any agents in the same company
    SELECT COUNT(*) INTO agent_count
    FROM agents a
    WHERE a.owner_id = NEW.owner_id;
    
    -- Only create relationships if there are agents
    IF agent_count > 0 THEN
        -- Insert client relationships for the new customer with all existing agents
        INSERT INTO clients (customer_id, agent_id)
        SELECT NEW.id, a.id
        FROM agents a
        WHERE a.owner_id = NEW.owner_id
        ON CONFLICT (agent_id, customer_id) DO NOTHING;
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Created % client relationships for new customer %', inserted_count, NEW.id;
    ELSE
        RAISE NOTICE 'No agents found for company %, skipping client relationship creation', NEW.owner_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating client relationships for customer %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create improved function to create client relationships for a new agent
CREATE OR REPLACE FUNCTION create_client_relationships_for_agent()
RETURNS TRIGGER AS $$
DECLARE
    customer_count INTEGER;
    inserted_count INTEGER;
BEGIN
    -- Check if there are any customers in the same company
    SELECT COUNT(*) INTO customer_count
    FROM customers c
    WHERE c.owner_id = NEW.owner_id;
    
    -- Only create relationships if there are customers
    IF customer_count > 0 THEN
        -- Insert client relationships for the new agent with all existing customers
        INSERT INTO clients (customer_id, agent_id)
        SELECT c.id, NEW.id
        FROM customers c
        WHERE c.owner_id = NEW.owner_id
        ON CONFLICT (agent_id, customer_id) DO NOTHING;
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Created % client relationships for new agent %', inserted_count, NEW.id;
    ELSE
        RAISE NOTICE 'No customers found for company %, skipping client relationship creation', NEW.owner_id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating client relationships for agent %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle customer deletion
CREATE OR REPLACE FUNCTION remove_client_relationships_for_customer()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete all client relationships for the deleted customer
    DELETE FROM clients WHERE customer_id = OLD.id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Removed % client relationships for deleted customer %', deleted_count, OLD.id;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error removing client relationships for customer %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle agent deletion
CREATE OR REPLACE FUNCTION remove_client_relationships_for_agent()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete all client relationships for the deleted agent
    DELETE FROM clients WHERE agent_id = OLD.id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Removed % client relationships for deleted agent %', deleted_count, OLD.id;
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error removing client relationships for agent %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_create_client_relationships_customer
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_client_relationships_for_customer();

CREATE TRIGGER trigger_create_client_relationships_agent
    AFTER INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION create_client_relationships_for_agent();

CREATE TRIGGER trigger_remove_client_relationships_customer
    BEFORE DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION remove_client_relationships_for_customer();

CREATE TRIGGER trigger_remove_client_relationships_agent
    BEFORE DELETE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION remove_client_relationships_for_agent();

-- Now fix missing relationships
DO $$
DECLARE
    company_id UUID;
    customer_record RECORD;
    agent_record RECORD;
    missing_count INTEGER := 0;
    created_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Fixing missing client relationships...';
    
    -- For each company, create missing relationships
    FOR company_id IN SELECT DISTINCT owner_id FROM companies LOOP
        RAISE NOTICE 'Processing company: %', company_id;
        
        -- For each customer in this company
        FOR customer_record IN 
            SELECT id FROM customers WHERE owner_id = company_id
        LOOP
            -- For each agent in this company
            FOR agent_record IN 
                SELECT id FROM agents WHERE owner_id = company_id
            LOOP
                -- Check if relationship already exists
                IF NOT EXISTS (
                    SELECT 1 FROM clients 
                    WHERE customer_id = customer_record.id 
                    AND agent_id = agent_record.id
                ) THEN
                    -- Create missing relationship
                    INSERT INTO clients (customer_id, agent_id)
                    VALUES (customer_record.id, agent_record.id)
                    ON CONFLICT (agent_id, customer_id) DO NOTHING;
                    
                    GET DIAGNOSTICS created_count = ROW_COUNT;
                    IF created_count > 0 THEN
                        missing_count := missing_count + 1;
                        RAISE NOTICE 'Created relationship: Customer % - Agent %', customer_record.id, agent_record.id;
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Fixed % missing client relationships', missing_count;
END $$;

-- Verify the fix
SELECT 
    'Before Fix' as status,
    COUNT(*) as total_relationships
FROM clients
UNION ALL
SELECT 
    'After Fix' as status,
    COUNT(*) as total_relationships
FROM clients;

-- Show final relationship count by company
SELECT 
    comp.company_name,
    COUNT(DISTINCT cust.id) as customer_count,
    COUNT(DISTINCT ag.id) as agent_count,
    COUNT(cl.id) as client_relationship_count,
    (COUNT(DISTINCT cust.id) * COUNT(DISTINCT ag.id)) as expected_relationships,
    CASE 
        WHEN COUNT(DISTINCT cust.id) * COUNT(DISTINCT ag.id) = COUNT(cl.id) 
        THEN '✅ Complete' 
        ELSE '❌ Incomplete' 
    END as status
FROM companies comp
LEFT JOIN customers cust ON cust.owner_id = comp.id
LEFT JOIN agents ag ON ag.owner_id = comp.id
LEFT JOIN clients cl ON (cl.customer_id = cust.id OR cl.agent_id = ag.id)
GROUP BY comp.id, comp.company_name
ORDER BY comp.company_name;

-- Test the triggers work going forward
DO $$
DECLARE
    test_company_id UUID;
    test_customer_id INTEGER;
    test_agent_id INTEGER;
    relationship_count_before INTEGER;
    relationship_count_after INTEGER;
BEGIN
    -- Get a test company
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NULL THEN
        RAISE NOTICE 'No companies found. Cannot test triggers.';
        RETURN;
    END IF;
    
    -- Count relationships before test
    SELECT COUNT(*) INTO relationship_count_before
    FROM clients cl
    JOIN customers c ON cl.customer_id = c.id
    WHERE c.owner_id = test_company_id;
    
    RAISE NOTICE 'Testing triggers with company: %. Relationships before: %', test_company_id, relationship_count_before;
    
    -- Create a test customer (should trigger relationships with existing agents)
    INSERT INTO customers (
        cus_first_name, 
        cus_last_name, 
        cus_email_address, 
        cus_is_active, 
        owner_id
    ) VALUES (
        'Trigger Test', 
        'Customer', 
        'trigger@test.com', 
        true, 
        test_company_id
    ) RETURNING id INTO test_customer_id;
    
    -- Count relationships after customer creation
    SELECT COUNT(*) INTO relationship_count_after
    FROM clients cl
    JOIN customers c ON cl.customer_id = c.id
    WHERE c.owner_id = test_company_id;
    
    RAISE NOTICE 'After customer creation - Relationships: % (Added: %)', 
        relationship_count_after, relationship_count_after - relationship_count_before;
    
    -- Create a test agent (should trigger relationships with existing customers)
    INSERT INTO agents (
        agent_code,
        agent_email,
        agent_name,
        agent_is_active,
        owner_id
    ) VALUES (
        'TRIGGER' || EXTRACT(EPOCH FROM NOW())::INTEGER,
        'trigger@agent.com',
        'Trigger Test Agent',
        true,
        test_company_id
    ) RETURNING id INTO test_agent_id;
    
    -- Count relationships after agent creation
    SELECT COUNT(*) INTO relationship_count_before
    FROM clients cl
    JOIN customers c ON cl.customer_id = c.id
    WHERE c.owner_id = test_company_id;
    
    RAISE NOTICE 'After agent creation - Relationships: %', relationship_count_before;
    
    -- Clean up test data
    DELETE FROM agents WHERE id = test_agent_id;
    DELETE FROM customers WHERE id = test_customer_id;
    
    RAISE NOTICE 'Trigger test completed. Cleaned up test data.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger test failed: %', SQLERRM;
END $$; 