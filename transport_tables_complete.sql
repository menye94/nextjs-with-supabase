-- =====================================================
-- COMPLETE TRANSPORT SYSTEM TABLES AND POLICIES
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TRANSPORT TYPE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_type (
    id serial NOT NULL,
    name varchar NOT NULL,
    is_active boolean DEFAULT true,
    owner_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes for transport_type
CREATE INDEX IF NOT EXISTS idx_transport_type_owner_id ON transport_type(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_type_name ON transport_type(name);

-- RLS for transport_type
ALTER TABLE transport_type ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport types from their company" ON transport_type
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport types for their company" ON transport_type
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport types from their company" ON transport_type
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport types from their company" ON transport_type
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 2. TRANSPORT TICKET TYPE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_ticket_type (
    id serial NOT NULL,
    name varchar NOT NULL,
    owner_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes for transport_ticket_type
CREATE INDEX IF NOT EXISTS idx_transport_ticket_type_owner_id ON transport_ticket_type(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_ticket_type_name ON transport_ticket_type(name);

-- RLS for transport_ticket_type
ALTER TABLE transport_ticket_type ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport ticket types from their company" ON transport_ticket_type
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport ticket types for their company" ON transport_ticket_type
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport ticket types from their company" ON transport_ticket_type
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport ticket types from their company" ON transport_ticket_type
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 3. TRANSPORT FUEL OPTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_fuel_option (
    id serial NOT NULL,
    name varchar NOT NULL,
    owner_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes for transport_fuel_option
CREATE INDEX IF NOT EXISTS idx_transport_fuel_option_owner_id ON transport_fuel_option(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_fuel_option_name ON transport_fuel_option(name);

-- RLS for transport_fuel_option
ALTER TABLE transport_fuel_option ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport fuel options from their company" ON transport_fuel_option
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport fuel options for their company" ON transport_fuel_option
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport fuel options from their company" ON transport_fuel_option
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport fuel options from their company" ON transport_fuel_option
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 4. TRANSPORT CATEGORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_category (
    id serial NOT NULL,
    name varchar NOT NULL,
    owner_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes for transport_category
CREATE INDEX IF NOT EXISTS idx_transport_category_owner_id ON transport_category(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_category_name ON transport_category(name);

-- RLS for transport_category
ALTER TABLE transport_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport categories from their company" ON transport_category
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport categories for their company" ON transport_category
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport categories from their company" ON transport_category
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport categories from their company" ON transport_category
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 5. TRANSPORT COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_companies (
    id serial NOT NULL,
    city_id int NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    type_id int NOT NULL REFERENCES transport_type(id) ON DELETE CASCADE,
    name varchar NOT NULL,
    description varchar,
    owner_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT unique_company_name_per_owner UNIQUE (owner_id, name)
);

-- Indexes for transport_companies
CREATE INDEX IF NOT EXISTS idx_transport_companies_owner_id ON transport_companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_city_id ON transport_companies(city_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_type_id ON transport_companies(type_id);
CREATE INDEX IF NOT EXISTS idx_transport_companies_name ON transport_companies(name);

-- RLS for transport_companies
ALTER TABLE transport_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport companies from their company" ON transport_companies
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport companies for their company" ON transport_companies
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport companies from their company" ON transport_companies
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport companies from their company" ON transport_companies
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 6. TRANSPORT SEASONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_seasons (
    id serial NOT NULL,
    start_date timestamptz,
    end_date timestamptz,
    season_name varchar,
    transport_company_id int NOT NULL REFERENCES transport_companies(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT transport_seasons_unique UNIQUE (start_date, end_date, transport_company_id)
);

-- Indexes for transport_seasons
CREATE INDEX IF NOT EXISTS idx_transport_seasons_owner_id ON transport_seasons(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_seasons_transport_company_id ON transport_seasons(transport_company_id);
CREATE INDEX IF NOT EXISTS idx_transport_seasons_dates ON transport_seasons(start_date, end_date);

-- RLS for transport_seasons
ALTER TABLE transport_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport seasons from their company" ON transport_seasons
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport seasons for their company" ON transport_seasons
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport seasons from their company" ON transport_seasons
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport seasons from their company" ON transport_seasons
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 7. TRANSPORT SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_services (
    id serial NOT NULL,
    transport_type_id int REFERENCES transport_type(id) ON DELETE SET NULL,
    transport_ticket_type int NOT NULL REFERENCES transport_ticket_type(id) ON DELETE CASCADE,
    transport_fuel_option_id int NOT NULL REFERENCES transport_fuel_option(id) ON DELETE CASCADE,
    transport_category_id int NOT NULL REFERENCES transport_category(id) ON DELETE CASCADE,
    currency_id int NOT NULL REFERENCES currency(id) ON DELETE CASCADE,
    price real,
    company_id int NOT NULL REFERENCES transport_companies(id) ON DELETE CASCADE,
    from_location int NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    to_location int NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transport_season_id int NOT NULL REFERENCES transport_seasons(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- Indexes for transport_services
CREATE INDEX IF NOT EXISTS idx_transport_services_owner_id ON transport_services(owner_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_type_id ON transport_services(transport_type_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_ticket_type ON transport_services(transport_ticket_type);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_fuel_option_id ON transport_services(transport_fuel_option_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_category_id ON transport_services(transport_category_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_currency_id ON transport_services(currency_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_company_id ON transport_services(company_id);
CREATE INDEX IF NOT EXISTS idx_transport_services_from_location ON transport_services(from_location);
CREATE INDEX IF NOT EXISTS idx_transport_services_to_location ON transport_services(to_location);
CREATE INDEX IF NOT EXISTS idx_transport_services_transport_season_id ON transport_services(transport_season_id);

-- RLS for transport_services
ALTER TABLE transport_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transport services from their company" ON transport_services
    FOR SELECT USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transport services for their company" ON transport_services
    FOR INSERT WITH CHECK (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transport services from their company" ON transport_services
    FOR UPDATE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transport services from their company" ON transport_services
    FOR DELETE USING (
        owner_id IN (
            SELECT id FROM companies 
            WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 8. TRANSPORT RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transport_rates (
    id serial NOT NULL,
    transport_service_id int NOT NULL REFERENCES transport_services(id) ON DELETE CASCADE,
    transport_season_id int NOT NULL REFERENCES transport_seasons(id) ON DELETE CASCADE,
    rate real,
    currency_id int NOT NULL REFERENCES currency(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT transport_rates_unique UNIQUE (transport_season_id, transport_service_id)
);

-- Indexes for transport_rates
CREATE INDEX IF NOT EXISTS idx_transport_rates_transport_service_id ON transport_rates(transport_service_id);
CREATE INDEX IF NOT EXISTS idx_transport_rates_transport_season_id ON transport_rates(transport_season_id);
CREATE INDEX IF NOT EXISTS idx_transport_rates_currency_id ON transport_rates(currency_id);

-- RLS for transport_rates
ALTER TABLE transport_rates ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_transport_type_updated_at BEFORE UPDATE ON transport_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_ticket_type_updated_at BEFORE UPDATE ON transport_ticket_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_fuel_option_updated_at BEFORE UPDATE ON transport_fuel_option FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_category_updated_at BEFORE UPDATE ON transport_category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_companies_updated_at BEFORE UPDATE ON transport_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_seasons_updated_at BEFORE UPDATE ON transport_seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_services_updated_at BEFORE UPDATE ON transport_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_rates_updated_at BEFORE UPDATE ON transport_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUMMARY OF TABLES CREATED
-- =====================================================
/*
1. transport_type - Types of transport (Bus, Car, Train, etc.)
2. transport_ticket_type - Types of tickets (Economy, Business, First Class, etc.)
3. transport_fuel_option - Fuel options (Petrol, Diesel, Electric, etc.)
4. transport_category - Transport categories (Local, Intercity, International, etc.)
5. transport_companies - Transport companies with city and type
6. transport_seasons - Seasons for transport companies
7. transport_services - Main transport services with all details
8. transport_rates - Rates for transport services by season
*/ 