-- Update agents table to change company_id to owner_id with proper foreign key reference

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS agents;

-- Create the updated agents table
CREATE TABLE agents (
    id serial NOT NULL,
    agent_code varchar NOT NULL,
    agent_email varchar,
    agent_name varchar,
    agent_is_active boolean,
    owner_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    PRIMARY KEY (id),
    CONSTRAINT unique_agent_code UNIQUE (agent_code)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(agent_email);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(agent_is_active);
CREATE INDEX IF NOT EXISTS idx_agents_code ON agents(agent_code);

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
CREATE POLICY "Users can view agents from their company" ON agents
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert agents for their company" ON agents
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agents from their company" ON agents
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agents from their company" ON agents
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE agents IS 'Agent information table with company ownership';
COMMENT ON COLUMN agents.owner_id IS 'Reference to the company that owns this agent record';
COMMENT ON COLUMN agents.agent_code IS 'Unique identifier code for the agent';
COMMENT ON COLUMN agents.agent_is_active IS 'Whether the agent is currently active'; 