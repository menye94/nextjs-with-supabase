-- Add owner_id field to transport_fuel_option table
ALTER TABLE transport_fuel_option 
ADD COLUMN owner_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transport_fuel_option_owner_id ON transport_fuel_option(owner_id);

-- Add RLS policy for transport_fuel_option table
ALTER TABLE transport_fuel_option ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport fuel options owned by their company
CREATE POLICY "Users can view transport fuel options from their company" ON transport_fuel_option
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport fuel options for their company
CREATE POLICY "Users can insert transport fuel options for their company" ON transport_fuel_option
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport fuel options from their company
CREATE POLICY "Users can update transport fuel options from their company" ON transport_fuel_option
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport fuel options from their company
CREATE POLICY "Users can delete transport fuel options from their company" ON transport_fuel_option
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Add owner_id field to transport_category table
ALTER TABLE transport_category 
ADD COLUMN owner_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transport_category_owner_id ON transport_category(owner_id);

-- Add RLS policy for transport_category table
ALTER TABLE transport_category ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport categories owned by their company
CREATE POLICY "Users can view transport categories from their company" ON transport_category
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport categories for their company
CREATE POLICY "Users can insert transport categories for their company" ON transport_category
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport categories from their company
CREATE POLICY "Users can update transport categories from their company" ON transport_category
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport categories from their company
CREATE POLICY "Users can delete transport categories from their company" ON transport_category
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    ); 