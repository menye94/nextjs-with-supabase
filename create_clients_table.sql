-- Create clients table to manage customer-agent relationships
-- This table establishes many-to-many relationships between customers and agents

-- Create the clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL NOT NULL,
    customer_id INT NOT NULL,
    agent_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT unique_client UNIQUE (agent_id, customer_id),
    CONSTRAINT fk_clients_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_clients_agent_id FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_customer_id ON clients(customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_agent_id ON clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for SELECT: Users can only see clients where their company owns either the customer or agent
CREATE POLICY "Users can view clients for their company" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN companies comp ON c.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE c.id = clients.customer_id AND u.id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM agents a
            JOIN companies comp ON a.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE a.id = clients.agent_id AND u.id = auth.uid()
        )
    );

-- Policy for INSERT: Users can only create clients where their company owns both customer and agent
CREATE POLICY "Users can create clients for their company" ON clients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN companies comp ON c.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE c.id = clients.customer_id AND u.id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM agents a
            JOIN companies comp ON a.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE a.id = clients.agent_id AND u.id = auth.uid()
        )
    );

-- Policy for UPDATE: Users can only update clients where their company owns both customer and agent
CREATE POLICY "Users can update clients for their company" ON clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN companies comp ON c.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE c.id = clients.customer_id AND u.id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM agents a
            JOIN companies comp ON a.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE a.id = clients.agent_id AND u.id = auth.uid()
        )
    );

-- Policy for DELETE: Users can only delete clients where their company owns both customer and agent
CREATE POLICY "Users can delete clients for their company" ON clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM customers c
            JOIN companies comp ON c.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE c.id = clients.customer_id AND u.id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM agents a
            JOIN companies comp ON a.owner_id = comp.id
            JOIN auth.users u ON comp.owner_id = u.id
            WHERE a.id = clients.agent_id AND u.id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- Add table and column comments
COMMENT ON TABLE clients IS 'Client relationships between customers and agents';
COMMENT ON COLUMN clients.id IS 'Primary key for client relationship';
COMMENT ON COLUMN clients.customer_id IS 'Foreign key reference to customers table';
COMMENT ON COLUMN clients.agent_id IS 'Foreign key reference to agents table';
COMMENT ON COLUMN clients.created_at IS 'Timestamp when the client relationship was created';
COMMENT ON COLUMN clients.updated_at IS 'Timestamp when the client relationship was last updated';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Clients table created successfully!';
    RAISE NOTICE 'Table includes foreign key constraints to customers and agents tables.';
    RAISE NOTICE 'RLS policies ensure users can only access their company data.';
    RAISE NOTICE 'Unique constraint prevents duplicate customer-agent relationships.';
END $$; 