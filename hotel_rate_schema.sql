-- Hotel Rate Schema
-- This schema handles hotel pricing with support for seasons, meal plans, and room types

-- Create hotel_rate table (base rate table)
CREATE TABLE IF NOT EXISTS hotel_rate (
    id SERIAL NOT NULL,
    hotel_id INT NOT NULL,
    room_id INT NOT NULL,
    season_id INT NOT NULL,
    meal_plan_id INT,
    base_rate DECIMAL(10,2) NOT NULL,
    currency_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_meal_plan FOREIGN KEY (meal_plan_id) REFERENCES hotel_meal_plans(id) ON DELETE SET NULL,
    CONSTRAINT fk_hotel_rate_currency FOREIGN KEY (currency_id) REFERENCES currency(id),
    CONSTRAINT unique_hotel_rate UNIQUE (hotel_id, room_id, season_id, meal_plan_id)
);

-- Create hotel_rate_options table (for additional rate options like single/double occupancy)
CREATE TABLE IF NOT EXISTS hotel_rate_options (
    id SERIAL NOT NULL,
    hotel_rate_id INT NOT NULL,
    rates_option_id INT NOT NULL,
    additional_fee DECIMAL(10,2) DEFAULT 0.00,
    is_percentage BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_options_rate FOREIGN KEY (hotel_rate_id) REFERENCES hotel_rate(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_options_option FOREIGN KEY (rates_option_id) REFERENCES hotel_rates_option(id) ON DELETE CASCADE,
    CONSTRAINT unique_rate_option UNIQUE (hotel_rate_id, rates_option_id)
);

-- Create hotel_rate_discounts table (for special discounts)
CREATE TABLE IF NOT EXISTS hotel_rate_discounts (
    id SERIAL NOT NULL,
    hotel_rate_id INT NOT NULL,
    discount_name VARCHAR(100) NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_stay_nights INT DEFAULT 1,
    max_stay_nights INT,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_discounts_rate FOREIGN KEY (hotel_rate_id) REFERENCES hotel_rate(id) ON DELETE CASCADE
);

-- Create hotel_rate_availability table (for managing room availability)
CREATE TABLE IF NOT EXISTS hotel_rate_availability (
    id SERIAL NOT NULL,
    hotel_rate_id INT NOT NULL,
    date DATE NOT NULL,
    available_rooms INT NOT NULL DEFAULT 1,
    is_blocked BOOLEAN DEFAULT false,
    block_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_availability_rate FOREIGN KEY (hotel_rate_id) REFERENCES hotel_rate(id) ON DELETE CASCADE,
    CONSTRAINT unique_rate_date UNIQUE (hotel_rate_id, date)
);

-- Create hotel_rate_packages table (for bundled rates)
CREATE TABLE IF NOT EXISTS hotel_rate_packages (
    id SERIAL NOT NULL,
    hotel_id INT NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    package_description TEXT,
    base_rate DECIMAL(10,2) NOT NULL,
    currency_id INT NOT NULL,
    includes_meal_plan BOOLEAN DEFAULT false,
    includes_activities BOOLEAN DEFAULT false,
    min_stay_nights INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_packages_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_packages_currency FOREIGN KEY (currency_id) REFERENCES currency(id)
);

-- Create hotel_rate_package_items table (for package components)
CREATE TABLE IF NOT EXISTS hotel_rate_package_items (
    id SERIAL NOT NULL,
    package_id INT NOT NULL,
    hotel_rate_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT fk_hotel_rate_package_items_package FOREIGN KEY (package_id) REFERENCES hotel_rate_packages(id) ON DELETE CASCADE,
    CONSTRAINT fk_hotel_rate_package_items_rate FOREIGN KEY (hotel_rate_id) REFERENCES hotel_rate(id) ON DELETE CASCADE,
    CONSTRAINT unique_package_rate UNIQUE (package_id, hotel_rate_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE hotel_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rate_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rate_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rate_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rate_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rate_package_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hotel_rate table
CREATE POLICY "Users can view own hotel rates" ON hotel_rate
    FOR SELECT USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rates" ON hotel_rate
    FOR INSERT WITH CHECK (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rates" ON hotel_rate
    FOR UPDATE USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rates" ON hotel_rate
    FOR DELETE USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create RLS policies for hotel_rate_options table
CREATE POLICY "Users can view own hotel rate options" ON hotel_rate_options
    FOR SELECT USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rate options" ON hotel_rate_options
    FOR INSERT WITH CHECK (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rate options" ON hotel_rate_options
    FOR UPDATE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rate options" ON hotel_rate_options
    FOR DELETE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create RLS policies for hotel_rate_discounts table
CREATE POLICY "Users can view own hotel rate discounts" ON hotel_rate_discounts
    FOR SELECT USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rate discounts" ON hotel_rate_discounts
    FOR INSERT WITH CHECK (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rate discounts" ON hotel_rate_discounts
    FOR UPDATE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rate discounts" ON hotel_rate_discounts
    FOR DELETE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create RLS policies for hotel_rate_availability table
CREATE POLICY "Users can view own hotel rate availability" ON hotel_rate_availability
    FOR SELECT USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rate availability" ON hotel_rate_availability
    FOR INSERT WITH CHECK (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rate availability" ON hotel_rate_availability
    FOR UPDATE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rate availability" ON hotel_rate_availability
    FOR DELETE USING (
        hotel_rate_id IN (
            SELECT hr.id FROM hotel_rate hr
            JOIN hotels h ON hr.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create RLS policies for hotel_rate_packages table
CREATE POLICY "Users can view own hotel rate packages" ON hotel_rate_packages
    FOR SELECT USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rate packages" ON hotel_rate_packages
    FOR INSERT WITH CHECK (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rate packages" ON hotel_rate_packages
    FOR UPDATE USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rate packages" ON hotel_rate_packages
    FOR DELETE USING (
        hotel_id IN (
            SELECT h.id FROM hotels h
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create RLS policies for hotel_rate_package_items table
CREATE POLICY "Users can view own hotel rate package items" ON hotel_rate_package_items
    FOR SELECT USING (
        package_id IN (
            SELECT hrp.id FROM hotel_rate_packages hrp
            JOIN hotels h ON hrp.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own hotel rate package items" ON hotel_rate_package_items
    FOR INSERT WITH CHECK (
        package_id IN (
            SELECT hrp.id FROM hotel_rate_packages hrp
            JOIN hotels h ON hrp.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own hotel rate package items" ON hotel_rate_package_items
    FOR UPDATE USING (
        package_id IN (
            SELECT hrp.id FROM hotel_rate_packages hrp
            JOIN hotels h ON hrp.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own hotel rate package items" ON hotel_rate_package_items
    FOR DELETE USING (
        package_id IN (
            SELECT hrp.id FROM hotel_rate_packages hrp
            JOIN hotels h ON hrp.hotel_id = h.id
            JOIN companies c ON h.owner_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_hotel_rate_hotel_id ON hotel_rate(hotel_id);
CREATE INDEX idx_hotel_rate_room_id ON hotel_rate(room_id);
CREATE INDEX idx_hotel_rate_season_id ON hotel_rate(season_id);
CREATE INDEX idx_hotel_rate_meal_plan_id ON hotel_rate(meal_plan_id);
CREATE INDEX idx_hotel_rate_active ON hotel_rate(is_active);

CREATE INDEX idx_hotel_rate_options_rate_id ON hotel_rate_options(hotel_rate_id);
CREATE INDEX idx_hotel_rate_options_option_id ON hotel_rate_options(rates_option_id);

CREATE INDEX idx_hotel_rate_discounts_rate_id ON hotel_rate_discounts(hotel_rate_id);
CREATE INDEX idx_hotel_rate_discounts_valid_dates ON hotel_rate_discounts(valid_from, valid_to);

CREATE INDEX idx_hotel_rate_availability_rate_id ON hotel_rate_availability(hotel_rate_id);
CREATE INDEX idx_hotel_rate_availability_date ON hotel_rate_availability(date);

CREATE INDEX idx_hotel_rate_packages_hotel_id ON hotel_rate_packages(hotel_id);
CREATE INDEX idx_hotel_rate_packages_active ON hotel_rate_packages(is_active);

CREATE INDEX idx_hotel_rate_package_items_package_id ON hotel_rate_package_items(package_id);
CREATE INDEX idx_hotel_rate_package_items_rate_id ON hotel_rate_package_items(hotel_rate_id); 