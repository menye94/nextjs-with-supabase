-- Fix owner_id field type in transport_services table
ALTER TABLE transport_services 
ALTER COLUMN owner_id TYPE uuid USING owner_id::uuid;

-- Add foreign key constraint for owner_id
ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_owner_id 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraints for other fields
ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_transport_type_id 
FOREIGN KEY (transport_type_id) REFERENCES transport_type(id) ON DELETE SET NULL;

ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_transport_ticket_type 
FOREIGN KEY (transport_ticket_type) REFERENCES transport_ticket_type(id) ON DELETE CASCADE;

ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_transport_fuel_option_id 
FOREIGN KEY (transport_fuel_option_id) REFERENCES transport_fuel_option(id) ON DELETE CASCADE;

ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_transport_category_id 
FOREIGN KEY (transport_category_id) REFERENCES transport_category(id) ON DELETE CASCADE;

ALTER TABLE transport_services 
ADD CONSTRAINT fk_transport_services_currency_id 
FOREIGN KEY (currency_id) REFERENCES currency(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transport_services_owner_id ON transport_services(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_type_id ON transport_services(transport_type_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_ticket_type ON transport_services(transport_ticket_type);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_fuel_option_id ON transport_services(transport_fuel_option_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_category_id ON transport_services(transport_category_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_currency_id ON transport_services(currency_id);

-- Add RLS policy for transport_services table
ALTER TABLE transport_services ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport services owned by their company
CREATE POLICY "Users can view transport services from their company" ON transport_services
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport services for their company
CREATE POLICY "Users can insert transport services for their company" ON transport_services
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport services from their company
CREATE POLICY "Users can update transport services from their company" ON transport_services
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport services from their company
CREATE POLICY "Users can delete transport services from their company" ON transport_services
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    ); 