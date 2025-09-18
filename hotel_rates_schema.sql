-- Hotel Rates Schema
-- This schema handles hotel pricing with support for seasons, meal plans, and room types

-- Create hotel_pricing_type table
CREATE TABLE IF NOT EXISTS hotel_pricing_type (
    id serial NOT NULL,
    name varchar NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT unique_pricing_type_name UNIQUE (name)
);

-- Create hotel_rates table
CREATE TABLE IF NOT EXISTS hotel_rates (
    id serial NOT NULL,
    hotel_id int NOT NULL,
    hotel_room_id int NOT NULL,
    rate real,
    meal_plan_id int NOT NULL,
    tax_behavior int NOT NULL,
    hotel_season_id int NOT NULL,
    hotel_rates_option_id int NOT NULL,
    currency_id int NOT NULL,
    entry_type_id int,
    hotel_pricing_type_id int NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rates_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_hotel_room FOREIGN KEY (hotel_room_id) REFERENCES hotel_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES hotel_meal_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_tax_behavior FOREIGN KEY (tax_behavior) REFERENCES tax_behaviour(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_hotel_season FOREIGN KEY (hotel_season_id) REFERENCES hotels_seasons(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_option FOREIGN KEY (hotel_rates_option_id) REFERENCES hotel_rates_option(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_currency FOREIGN KEY (currency_id) REFERENCES currency(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rates_entry_type FOREIGN KEY (entry_type_id) REFERENCES entry_type(id) ON DELETE SET NULL,
    CONSTRAINT fk_hotel_rates_pricing_type FOREIGN KEY (hotel_pricing_type_id) REFERENCES hotel_pricing_type(id) ON DELETE CASCADE,
    CONSTRAINT unique_hotel_rate_combination UNIQUE (hotel_id, hotel_room_id, meal_plan_id, hotel_rates_option_id, entry_type_id, hotel_pricing_type_id)
);

-- Enable Row Level Security
ALTER TABLE hotel_pricing_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotel_pricing_type table
CREATE POLICY "Users can view all pricing types" ON hotel_pricing_type
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pricing types" ON hotel_pricing_type
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pricing types" ON hotel_pricing_type
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pricing types" ON hotel_pricing_type
    FOR DELETE USING (true);

-- Create RLS policies for hotel_rates table
CREATE POLICY "Users can view own hotel rates" ON hotel_rates
    FOR SELECT USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own hotel rates" ON hotel_rates
    FOR INSERT WITH CHECK (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own hotel rates" ON hotel_rates
    FOR UPDATE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete own hotel rates" ON hotel_rates
    FOR DELETE USING (
        hotel_id IN (
            SELECT id FROM hotels WHERE owner_id IN (
                SELECT id FROM companies WHERE owner_id = auth.uid()
            )
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_hotel_pricing_type_name ON hotel_pricing_type(name);

CREATE INDEX idx_hotel_rates_hotel_id ON hotel_rates(hotel_id);
CREATE INDEX idx_hotel_rates_hotel_room_id ON hotel_rates(hotel_room_id);
CREATE INDEX idx_hotel_rates_meal_plan_id ON hotel_rates(meal_plan_id);
CREATE INDEX idx_hotel_rates_hotel_season_id ON hotel_rates(hotel_season_id);
CREATE INDEX idx_hotel_rates_option_id ON hotel_rates(hotel_rates_option_id);
CREATE INDEX idx_hotel_rates_currency_id ON hotel_rates(currency_id);
CREATE INDEX idx_hotel_rates_entry_type_id ON hotel_rates(entry_type_id);
CREATE INDEX idx_hotel_rates_pricing_type_id ON hotel_rates(hotel_pricing_type_id);
 