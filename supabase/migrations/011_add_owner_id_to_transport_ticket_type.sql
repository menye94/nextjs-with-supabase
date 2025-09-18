-- Add owner_id field to transport_ticket_type table
ALTER TABLE transport_ticket_type 
ADD COLUMN owner_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transport_ticket_type_owner_id ON transport_ticket_type(owner_id);

-- Add RLS policy for transport_ticket_type table
ALTER TABLE transport_ticket_type ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport ticket types owned by their company
CREATE POLICY "Users can view transport ticket types from their company" ON transport_ticket_type
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport ticket types for their company
CREATE POLICY "Users can insert transport ticket types for their company" ON transport_ticket_type
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport ticket types from their company
CREATE POLICY "Users can update transport ticket types from their company" ON transport_ticket_type
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport ticket types from their company
CREATE POLICY "Users can delete transport ticket types from their company" ON transport_ticket_type
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    ); 