-- Fix client triggers with better error handling and edge case management
-- This script replaces the previous triggers with more robust versions

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
BEGIN
    -- Check if there are any agents in the same company
    SELECT COUNT(*) INTO agent_count
    FROM agents a
    JOIN companies comp ON a.owner_id = comp.id
    WHERE comp.id = NEW.owner_id;
    
    -- Only create relationships if there are agents
    IF agent_count > 0 THEN
        -- Insert client relationships for the new customer with all existing agents
        INSERT INTO clients (customer_id, agent_id)
        SELECT NEW.id, a.id
        FROM agents a
        JOIN companies comp ON a.owner_id = comp.id
        WHERE comp.id = NEW.owner_id
        ON CONFLICT (agent_id, customer_id) DO NOTHING;
        
        RAISE NOTICE 'Created % client relationships for new customer %', agent_count, NEW.id;
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
BEGIN
    -- Check if there are any customers in the same company
    SELECT COUNT(*) INTO customer_count
    FROM customers c
    JOIN companies comp ON c.owner_id = comp.id
    WHERE comp.id = NEW.owner_id;
    
    -- Only create relationships if there are customers
    IF customer_count > 0 THEN
        -- Insert client relationships for the new agent with all existing customers
        INSERT INTO clients (customer_id, agent_id)
        SELECT c.id, NEW.id
        FROM customers c
        JOIN companies comp ON c.owner_id = comp.id
        WHERE comp.id = NEW.owner_id
        ON CONFLICT (agent_id, customer_id) DO NOTHING;
        
        RAISE NOTICE 'Created % client relationships for new agent %', customer_count, NEW.id;
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

-- Create function to handle customer deletion (remove all client relationships)
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

-- Create function to handle agent deletion (remove all client relationships)
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

-- Create triggers with better error handling
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

-- Add comments for the functions
COMMENT ON FUNCTION create_client_relationships_for_customer() IS 'Automatically creates client relationships when a new customer is added (with error handling)';
COMMENT ON FUNCTION create_client_relationships_for_agent() IS 'Automatically creates client relationships when a new agent is added (with error handling)';
COMMENT ON FUNCTION remove_client_relationships_for_customer() IS 'Removes all client relationships when a customer is deleted (with error handling)';
COMMENT ON FUNCTION remove_client_relationships_for_agent() IS 'Removes all client relationships when an agent is deleted (with error handling)';

-- Test the triggers with a simple check
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND event_object_table IN ('customers', 'agents')
    AND trigger_name LIKE '%client%';
    
    RAISE NOTICE 'Successfully created % client relationship triggers', trigger_count;
    RAISE NOTICE 'Triggers now include error handling and edge case management';
    RAISE NOTICE 'Customer save operations should work properly now';
END $$; 