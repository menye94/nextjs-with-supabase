-- Check and create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  cus_first_name VARCHAR(255),
  cus_last_name VARCHAR(255),
  cus_address TEXT,
  cus_email_address VARCHAR(255),
  cus_details TEXT,
  customer_from DATE,
  cus_is_active BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  country_id INTEGER REFERENCES countries(id),
  since TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(cus_email_address);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(cus_first_name, cus_last_name);
CREATE INDEX IF NOT EXISTS idx_customers_country_id ON customers(country_id);

-- Enable Row Level Security for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can view their own company's customers" ON customers
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for their own company" ON customers
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own company's customers" ON customers
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own company's customers" ON customers
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Check and create agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  agent_code VARCHAR(255) NOT NULL UNIQUE,
  agent_email VARCHAR(255),
  agent_name VARCHAR(255),
  agent_is_active BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agents table
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_code ON agents(agent_code);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(agent_email);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(agent_name);

-- Enable Row Level Security for agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Users can view their own company's agents" ON agents
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents for their own company" ON agents
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own company's agents" ON agents
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own company's agents" ON agents
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON agents 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE customers IS 'Customer information for each company';
COMMENT ON COLUMN customers.id IS 'Primary key for customers table';
COMMENT ON COLUMN customers.cus_first_name IS 'Customer first name';
COMMENT ON COLUMN customers.cus_last_name IS 'Customer last name';
COMMENT ON COLUMN customers.cus_address IS 'Customer address';
COMMENT ON COLUMN customers.cus_email_address IS 'Customer email address';
COMMENT ON COLUMN customers.cus_details IS 'Additional customer details';
COMMENT ON COLUMN customers.customer_from IS 'Date when customer became a customer';
COMMENT ON COLUMN customers.cus_is_active IS 'Whether the customer is currently active';
COMMENT ON COLUMN customers.owner_id IS 'Reference to the company that owns this customer';
COMMENT ON COLUMN customers.country_id IS 'Reference to the customer country';
COMMENT ON COLUMN customers.since IS 'Timestamp when the record was created';
COMMENT ON COLUMN customers.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN customers.updated_at IS 'Timestamp when the record was last updated';

COMMENT ON TABLE agents IS 'Agent information for each company';
COMMENT ON COLUMN agents.id IS 'Primary key for agents table';
COMMENT ON COLUMN agents.agent_code IS 'Unique agent code';
COMMENT ON COLUMN agents.agent_email IS 'Agent email address';
COMMENT ON COLUMN agents.agent_name IS 'Agent full name';
COMMENT ON COLUMN agents.agent_is_active IS 'Whether the agent is currently active';
COMMENT ON COLUMN agents.owner_id IS 'Reference to the company that owns this agent';
COMMENT ON COLUMN agents.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN agents.updated_at IS 'Timestamp when the record was last updated'; 