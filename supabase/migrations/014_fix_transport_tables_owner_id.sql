-- Fix owner_id field type in transport_companies table
ALTER TABLE transport_companies 
ALTER COLUMN owner_id TYPE uuid USING owner_id::uuid;

-- Add foreign key constraint for owner_id in transport_companies
ALTER TABLE transport_companies 
ADD CONSTRAINT fk_transport_companies_owner_id 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraint for city_id in transport_companies
ALTER TABLE transport_companies 
ADD CONSTRAINT fk_transport_companies_city_id 
FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;

-- Add foreign key constraint for type_id in transport_companies
ALTER TABLE transport_companies 
ADD CONSTRAINT fk_transport_companies_type_id 
FOREIGN KEY (type_id) REFERENCES transport_type(id) ON DELETE CASCADE;

-- Add indexes for transport_companies
CREATE INDEX IF NOT EXISTS idx_transport_companies_owner_id ON transport_companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_city_id ON transport_companies(city_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_type_id ON transport_companies(type_id);

-- Add RLS policy for transport_companies table
ALTER TABLE transport_companies ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport companies owned by their company
CREATE POLICY "Users can view transport companies from their company" ON transport_companies
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport companies for their company
CREATE POLICY "Users can insert transport companies for their company" ON transport_companies
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport companies from their company
CREATE POLICY "Users can update transport companies from their company" ON transport_companies
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport companies from their company
CREATE POLICY "Users can delete transport companies from their company" ON transport_companies
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Fix owner_id field type in transport_seasons table
ALTER TABLE transport_seasons 
ALTER COLUMN owner_id TYPE uuid USING owner_id::uuid;

-- Add foreign key constraint for owner_id in transport_seasons
ALTER TABLE transport_seasons 
ADD CONSTRAINT fk_transport_seasons_owner_id 
FOREIGN KEY (owner_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraint for transport_company_id in transport_seasons
ALTER TABLE transport_seasons 
ADD CONSTRAINT fk_transport_seasons_transport_company_id 
FOREIGN KEY (transport_company_id) REFERENCES transport_companies(id) ON DELETE CASCADE;

-- Add indexes for transport_seasons
CREATE INDEX IF NOT EXISTS idx_transport_seasons_owner_id ON transport_seasons(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_seasons_transport_company_id ON transport_seasons(transport_company_id);

-- Add RLS policy for transport_seasons table
ALTER TABLE transport_seasons ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport seasons owned by their company
CREATE POLICY "Users can view transport seasons from their company" ON transport_seasons
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to insert transport seasons for their company
CREATE POLICY "Users can insert transport seasons for their company" ON transport_seasons
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to update transport seasons from their company
CREATE POLICY "Users can update transport seasons from their company" ON transport_seasons
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy to allow users to delete transport seasons from their company
CREATE POLICY "Users can delete transport seasons from their company" ON transport_seasons
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- Add foreign key constraints for transport_rates table
ALTER TABLE transport_rates 
ADD CONSTRAINT fk_transport_rates_transport_service_id 
FOREIGN KEY (transport_service_id) REFERENCES transport_services(id) ON DELETE CASCADE;

ALTER TABLE transport_rates 
ADD CONSTRAINT fk_transport_rates_transport_season_id 
FOREIGN KEY (transport_season_id) REFERENCES transport_seasons(id) ON DELETE CASCADE;

ALTER TABLE transport_rates 
ADD CONSTRAINT fk_transport_rates_currency_id 
FOREIGN KEY (currency_id) REFERENCES currency(id) ON DELETE CASCADE;

-- Add indexes for transport_rates
CREATE INDEX IF NOT EXISTS idx_transport_rates_transport_service_id ON transport_rates(transport_service_id);
CREATE INDEX IF NOT EXISTS idx_transport_rates_transport_season_id ON transport_rates(transport_season_id);
CREATE INDEX IF NOT EXISTS idx_transport_rates_currency_id ON transport_rates(currency_id);

-- Add RLS policy for transport_rates table
ALTER TABLE transport_rates ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see transport rates from their company
CREATE POLICY "Users can view transport rates from their company" ON transport_rates
    FOR SELECT USING (
        transport_service_id IN (
            SELECT id FROM transport_services 
            WHERE owner_id IN (
                SELECT id FROM companies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Policy to allow users to insert transport rates for their company
CREATE POLICY "Users can insert transport rates for their company" ON transport_rates
    FOR INSERT WITH CHECK (
        transport_service_id IN (
            SELECT id FROM transport_services 
            WHERE owner_id IN (
                SELECT id FROM companies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Policy to allow users to update transport rates from their company
CREATE POLICY "Users can update transport rates from their company" ON transport_rates
    FOR UPDATE USING (
        transport_service_id IN (
            SELECT id FROM transport_services 
            WHERE owner_id IN (
                SELECT id FROM companies 
                WHERE owner_id = auth.uid()
            )
        )
    );

-- Policy to allow users to delete transport rates from their company
CREATE POLICY "Users can delete transport rates from their company" ON transport_rates
    FOR DELETE USING (
        transport_service_id IN (
            SELECT id FROM transport_services 
            WHERE owner_id IN (
                SELECT id FROM companies 
                WHERE owner_id = auth.uid()
            )
        )
    ); 