-- Check if transport_ticket_type table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transport_ticket_type'
);

-- Create transport_ticket_type table if it doesn't exist
CREATE TABLE IF NOT EXISTS transport_ticket_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_transport_ticket_type_owner_id ON transport_ticket_type(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_ticket_type_name ON transport_ticket_type(name);

-- Enable RLS
ALTER TABLE transport_ticket_type ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view transport ticket types from their company" ON transport_ticket_type;
CREATE POLICY "Users can view transport ticket types from their company" ON transport_ticket_type
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert transport ticket types for their company" ON transport_ticket_type;
CREATE POLICY "Users can insert transport ticket types for their company" ON transport_ticket_type
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update transport ticket types from their company" ON transport_ticket_type;
CREATE POLICY "Users can update transport ticket types from their company" ON transport_ticket_type
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete transport ticket types from their company" ON transport_ticket_type;
CREATE POLICY "Users can delete transport ticket types from their company" ON transport_ticket_type
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transport_ticket_type_updated_at ON transport_ticket_type;
CREATE TRIGGER update_transport_ticket_type_updated_at 
    BEFORE UPDATE ON transport_ticket_type 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data if table is empty
INSERT INTO transport_ticket_type (name, owner_id)
SELECT 'Economy', c.id
FROM companies c
WHERE c.owner_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM transport_ticket_type WHERE owner_id = c.id
)
LIMIT 1;

INSERT INTO transport_ticket_type (name, owner_id)
SELECT 'Business', c.id
FROM companies c
WHERE c.owner_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM transport_ticket_type WHERE name = 'Business' AND owner_id = c.id
)
LIMIT 1;

INSERT INTO transport_ticket_type (name, owner_id)
SELECT 'First Class', c.id
FROM companies c
WHERE c.owner_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM transport_ticket_type WHERE name = 'First Class' AND owner_id = c.id
)
LIMIT 1; 