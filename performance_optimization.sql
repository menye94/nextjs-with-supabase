-- =====================================================
-- PERFORMANCE OPTIMIZATION SCRIPT
-- =====================================================

-- Add missing indexes for better query performance

-- Hotels table indexes
CREATE INDEX IF NOT EXISTS idx_hotels_hotel_name ON hotels(hotel_name);
CREATE INDEX IF NOT EXISTS idx_hotels_contact_email ON hotels(contact_email);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_is_deleted ON hotels(is_deleted);
CREATE INDEX IF NOT EXISTS idx_hotels_created_at ON hotels(created_at);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_city_id ON locations(city_id);
CREATE INDEX IF NOT EXISTS idx_locations_national_park_id ON locations(national_park_id);

-- Cities table indexes
CREATE INDEX IF NOT EXISTS idx_cities_city_name ON cities(city_name);

-- National parks table indexes
CREATE INDEX IF NOT EXISTS idx_national_parks_park_name ON national_parks(national_park_name);

-- Hotel categories table indexes
CREATE INDEX IF NOT EXISTS idx_hotel_category_name ON hotel_category(name);

-- Hotel rooms table indexes
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_is_available ON hotel_rooms(is_available);

-- Rooms table indexes
CREATE INDEX IF NOT EXISTS idx_rooms_room_name ON rooms(room_name);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

-- Hotel seasons table indexes
CREATE INDEX IF NOT EXISTS idx_hotels_seasons_dates ON hotels_seasons(start_date, end_date);

-- Hotel rates table indexes
CREATE INDEX IF NOT EXISTS idx_hotel_rates_price ON hotel_rates(price);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_is_active ON hotel_rates(is_active);

-- Equipment table indexes
CREATE INDEX IF NOT EXISTS idx_equipments_name ON equipments(name);
CREATE INDEX IF NOT EXISTS idx_equipments_price ON equipments(price);
CREATE INDEX IF NOT EXISTS idx_equipments_is_active ON equipments(is_active);

-- Transport table indexes
CREATE INDEX IF NOT EXISTS idx_transport_type_name ON transport_type(name);
CREATE INDEX IF NOT EXISTS idx_transport_type_is_active ON transport_type(is_active);

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_company_email ON companies(company_email);

-- Agents table indexes
CREATE INDEX IF NOT EXISTS idx_agents_agent_name ON agents(agent_name);
CREATE INDEX IF NOT EXISTS idx_agents_agent_code ON agents(agent_code);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(cus_first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(cus_last_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(cus_email);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_agent_id ON clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_customer_id ON clients(customer_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_hotels_location_category ON hotels(location_id, category_id);
CREATE INDEX IF NOT EXISTS idx_hotels_owner_active ON hotels(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_active ON hotel_rates(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_equipments_category_active ON equipments(category_id, is_active);

-- Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_hotels_name_fts ON hotels USING gin(to_tsvector('english', hotel_name));
CREATE INDEX IF NOT EXISTS idx_cities_name_fts ON cities USING gin(to_tsvector('english', city_name));
CREATE INDEX IF NOT EXISTS idx_national_parks_name_fts ON national_parks USING gin(to_tsvector('english', national_park_name));

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_hotels_active_only ON hotels(hotel_name) WHERE is_active = true AND is_deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipments_active_only ON equipments(name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agents_active_only ON agents(agent_name) WHERE is_active = true;

-- Analyze tables to update statistics
ANALYZE hotels;
ANALYZE locations;
ANALYZE cities;
ANALYZE national_parks;
ANALYZE hotel_category;
ANALYZE hotel_rooms;
ANALYZE rooms;
ANALYZE hotels_seasons;
ANALYZE hotel_rates;
ANALYZE equipments;
ANALYZE transport_type;
ANALYZE companies;
ANALYZE agents;
ANALYZE customers;
ANALYZE clients;

-- Create materialized views for complex queries
CREATE MATERIALIZED VIEW IF NOT EXISTS hotel_summary AS
SELECT 
    h.id,
    h.hotel_name,
    h.contact_email,
    h.is_active,
    h.is_partner,
    l.city_id,
    l.national_park_id,
    c.city_name,
    np.national_park_name,
    hc.name as category_name,
    COUNT(hr.id) as room_count,
    COUNT(hs.id) as season_count,
    COUNT(hrates.id) as rate_count
FROM hotels h
LEFT JOIN locations l ON h.location_id = l.id
LEFT JOIN cities c ON l.city_id = c.id
LEFT JOIN national_parks np ON l.national_park_id = np.id
LEFT JOIN hotel_category hc ON h.category_id = hc.id
LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.is_available = true
LEFT JOIN hotels_seasons hs ON h.id = hs.hotel_id
LEFT JOIN hotel_rates hrates ON h.id = hrates.hotel_id AND hrates.is_active = true
WHERE h.is_deleted IS NULL
GROUP BY h.id, h.hotel_name, h.contact_email, h.is_active, h.is_partner, 
         l.city_id, l.national_park_id, c.city_name, np.national_park_name, hc.name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_hotel_summary_name ON hotel_summary(hotel_name);
CREATE INDEX IF NOT EXISTS idx_hotel_summary_active ON hotel_summary(is_active);
CREATE INDEX IF NOT EXISTS idx_hotel_summary_location ON hotel_summary(city_name, national_park_name);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_hotel_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hotel_summary;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when hotels table changes
CREATE OR REPLACE FUNCTION trigger_refresh_hotel_summary()
RETURNS trigger AS $$
BEGIN
    PERFORM refresh_hotel_summary();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS refresh_hotel_summary_trigger ON hotels;

-- Create trigger
CREATE TRIGGER refresh_hotel_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON hotels
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_hotel_summary();

-- Create function for optimized hotel search
CREATE OR REPLACE FUNCTION search_hotels(search_term text, location_filter text DEFAULT NULL, category_filter text DEFAULT NULL)
RETURNS TABLE (
    id int,
    hotel_name text,
    contact_email text,
    is_active boolean,
    location_name text,
    category_name text,
    room_count bigint,
    season_count bigint,
    rate_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hs.id,
        hs.hotel_name,
        hs.contact_email,
        hs.is_active,
        CASE 
            WHEN hs.city_name IS NOT NULL AND hs.national_park_name IS NOT NULL 
            THEN hs.city_name || ' - ' || hs.national_park_name
            WHEN hs.city_name IS NOT NULL 
            THEN hs.city_name
            WHEN hs.national_park_name IS NOT NULL 
            THEN hs.national_park_name
            ELSE 'Unknown Location'
        END as location_name,
        hs.category_name,
        hs.room_count,
        hs.season_count,
        hs.rate_count
    FROM hotel_summary hs
    WHERE (
        search_term IS NULL OR 
        hs.hotel_name ILIKE '%' || search_term || '%' OR
        hs.contact_email ILIKE '%' || search_term || '%' OR
        hs.city_name ILIKE '%' || search_term || '%' OR
        hs.national_park_name ILIKE '%' || search_term || '%'
    )
    AND (
        location_filter IS NULL OR 
        hs.city_name ILIKE '%' || location_filter || '%' OR
        hs.national_park_name ILIKE '%' || location_filter || '%'
    )
    AND (
        category_filter IS NULL OR 
        hs.category_name ILIKE '%' || category_filter || '%'
    )
    ORDER BY hs.hotel_name;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON hotel_summary TO authenticated;
GRANT EXECUTE ON FUNCTION search_hotels TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_hotel_summary TO authenticated;

-- Create performance monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- Create view for table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Create view for index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Grant permissions for monitoring views
GRANT SELECT ON slow_queries TO authenticated;
GRANT SELECT ON table_sizes TO authenticated;
GRANT SELECT ON index_usage TO authenticated;

-- Enable pg_stat_statements extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set configuration for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();

-- Display optimization summary
SELECT 'Performance optimization completed successfully!' as status;
