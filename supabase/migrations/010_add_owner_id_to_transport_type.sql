-- Add owner_id field to transport_type table
ALTER TABLE transport_type 
ADD COLUMN owner_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transport_type_owner_id ON transport_type(owner_id);

-- Add RLS policy for transport_type table
ALTER TABLE transport_type ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport types owned by their company
CREATE POLICY "Users can view transport types from their company" ON transport_type
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport types for their company
CREATE POLICY "Users can insert transport types for their company" ON transport_type
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport types from their company
CREATE POLICY "Users can update transport types from their company" ON transport_type
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport types from their company
CREATE POLICY "Users can delete transport types from their company" ON transport_type
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    ); 