-- Create triggers to automatically create client relationships
-- This script adds triggers that create entries in the clients table
-- when customers or agents are created

-- Function to create client relationships for a new customer
CREATE OR REPLACE FUNCTION create_client_relationships_for_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert client relationships for the new customer with all existing agents
    INSERT INTO clients (customer_id, agent_id)
    SELECT NEW.id, a.id
    FROM agents a
    JOIN companies comp ON a.owner_id = comp.id
    WHERE comp.id = (
        SELECT owner_id FROM customers WHERE id = NEW.id
    )
    ON CONFLICT (agent_id, customer_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create client relationships for a new agent
CREATE OR REPLACE FUNCTION create_client_relationships_for_agent()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert client relationships for the new agent with all existing customers
    INSERT INTO clients (customer_id, agent_id)
    SELECT c.id, NEW.id
    FROM customers c
    JOIN companies comp ON c.owner_id = comp.id
    WHERE comp.id = (
        SELECT owner_id FROM agents WHERE id = NEW.id
    )
    ON CONFLICT (agent_id, customer_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customers table
DROP TRIGGER IF EXISTS trigger_create_client_relationships_customer ON customers;
CREATE TRIGGER trigger_create_client_relationships_customer
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_client_relationships_for_customer();

-- Create trigger for agents table
DROP TRIGGER IF EXISTS trigger_create_client_relationships_agent ON agents;
CREATE TRIGGER trigger_create_client_relationships_agent
    AFTER INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION create_client_relationships_for_agent();

-- Function to handle customer deletion (remove all client relationships)
CREATE OR REPLACE FUNCTION remove_client_relationships_for_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all client relationships for the deleted customer
    DELETE FROM clients WHERE customer_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to handle agent deletion (remove all client relationships)
CREATE OR REPLACE FUNCTION remove_client_relationships_for_agent()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all client relationships for the deleted agent
    DELETE FROM clients WHERE agent_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for deletion
DROP TRIGGER IF EXISTS trigger_remove_client_relationships_customer ON customers;
CREATE TRIGGER trigger_remove_client_relationships_customer
    BEFORE DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION remove_client_relationships_for_customer();

DROP TRIGGER IF EXISTS trigger_remove_client_relationships_agent ON agents;
CREATE TRIGGER trigger_remove_client_relationships_agent
    BEFORE DELETE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION remove_client_relationships_for_agent();

-- Add comments for the functions
COMMENT ON FUNCTION create_client_relationships_for_customer() IS 'Automatically creates client relationships when a new customer is added';
COMMENT ON FUNCTION create_client_relationships_for_agent() IS 'Automatically creates client relationships when a new agent is added';
COMMENT ON FUNCTION remove_client_relationships_for_customer() IS 'Removes all client relationships when a customer is deleted';
COMMENT ON FUNCTION remove_client_relationships_for_agent() IS 'Removes all client relationships when an agent is deleted';

-- Test the triggers with sample data (optional - uncomment if you want to test)
/*
-- Test: Create a customer and see if client relationships are created
INSERT INTO customers (cus_first_name, cus_last_name, cus_email_address, owner_id) 
VALUES ('Test', 'Customer', 'test@example.com', 'your-company-id-here');

-- Check the created relationships
SELECT 
    c.cus_first_name || ' ' || c.cus_last_name as customer_name,
    a.agent_name as agent_name,
    cl.created_at
FROM clients cl
JOIN customers c ON cl.customer_id = c.id
JOIN agents a ON cl.agent_id = a.id
WHERE c.cus_email_address = 'test@example.com';
*/

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Auto-relationship triggers created successfully!';
    RAISE NOTICE 'When a customer is created, client relationships will be created with all existing agents.';
    RAISE NOTICE 'When an agent is created, client relationships will be created with all existing customers.';
    RAISE NOTICE 'When a customer or agent is deleted, all their client relationships will be removed.';
    RAISE NOTICE 'All relationships are created within the same company only.';
END $$; 