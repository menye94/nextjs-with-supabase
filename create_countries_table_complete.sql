-- Create countries table with all countries of the world
-- This script creates the table and populates it with 195+ countries

-- Drop table if exists (be careful with this in production)
-- DROP TABLE IF EXISTS countries;

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(country_name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- Enable Row Level Security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read countries
CREATE POLICY "Allow read access for all users" ON countries
    FOR SELECT USING (true);

-- Allow authenticated users to insert countries (for admin purposes)
CREATE POLICY "Allow insert for authenticated users" ON countries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update countries (for admin purposes)
CREATE POLICY "Allow update for authenticated users" ON countries
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete countries (for admin purposes)
CREATE POLICY "Allow delete for authenticated users" ON countries
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_countries_updated_at 
    BEFORE UPDATE ON countries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE countries IS 'List of all countries in the world';
COMMENT ON COLUMN countries.id IS 'Primary key';
COMMENT ON COLUMN countries.country_name IS 'Full name of the country';
COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-3 country code';
COMMENT ON COLUMN countries.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN countries.updated_at IS 'Timestamp when record was last updated';

-- Insert all countries of the world
INSERT INTO countries (country_name, code) VALUES
('Afghanistan', 'AFG'),
('Albania', 'ALB'),
('Algeria', 'DZA'),
('Andorra', 'AND'),
('Angola', 'AGO'),
('Antigua and Barbuda', 'ATG'),
('Argentina', 'ARG'),
('Armenia', 'ARM'),
('Australia', 'AUS'),
('Austria', 'AUT'),
('Azerbaijan', 'AZE'),
('Bahamas', 'BHS'),
('Bahrain', 'BHR'),
('Bangladesh', 'BGD'),
('Barbados', 'BRB'),
('Belarus', 'BLR'),
('Belgium', 'BEL'),
('Belize', 'BLZ'),
('Benin', 'BEN'),
('Bhutan', 'BTN'),
('Bolivia', 'BOL'),
('Bosnia and Herzegovina', 'BIH'),
('Botswana', 'BWA'),
('Brazil', 'BRA'),
('Brunei', 'BRN'),
('Bulgaria', 'BGR'),
('Burkina Faso', 'BFA'),
('Burundi', 'BDI'),
('Cabo Verde', 'CPV'),
('Cambodia', 'KHM'),
('Cameroon', 'CMR'),
('Canada', 'CAN'),
('Central African Republic', 'CAF'),
('Chad', 'TCD'),
('Chile', 'CHL'),
('China', 'CHN'),
('Colombia', 'COL'),
('Comoros', 'COM'),
('Congo', 'COG'),
('Costa Rica', 'CRI'),
('Croatia', 'HRV'),
('Cuba', 'CUB'),
('Cyprus', 'CYP'),
('Czech Republic', 'CZE'),
('Democratic Republic of the Congo', 'COD'),
('Denmark', 'DNK'),
('Djibouti', 'DJI'),
('Dominica', 'DMA'),
('Dominican Republic', 'DOM'),
('Ecuador', 'ECU'),
('Egypt', 'EGY'),
('El Salvador', 'SLV'),
('Equatorial Guinea', 'GNQ'),
('Eritrea', 'ERI'),
('Estonia', 'EST'),
('Eswatini', 'SWZ'),
('Ethiopia', 'ETH'),
('Fiji', 'FJI'),
('Finland', 'FIN'),
('France', 'FRA'),
('Gabon', 'GAB'),
('Gambia', 'GMB'),
('Georgia', 'GEO'),
('Germany', 'DEU'),
('Ghana', 'GHA'),
('Greece', 'GRC'),
('Grenada', 'GRD'),
('Guatemala', 'GTM'),
('Guinea', 'GIN'),
('Guinea-Bissau', 'GNB'),
('Guyana', 'GUY'),
('Haiti', 'HTI'),
('Honduras', 'HND'),
('Hungary', 'HUN'),
('Iceland', 'ISL'),
('India', 'IND'),
('Indonesia', 'IDN'),
('Iran', 'IRN'),
('Iraq', 'IRQ'),
('Ireland', 'IRL'),
('Israel', 'ISR'),
('Italy', 'ITA'),
('Ivory Coast', 'CIV'),
('Jamaica', 'JAM'),
('Japan', 'JPN'),
('Jordan', 'JOR'),
('Kazakhstan', 'KAZ'),
('Kenya', 'KEN'),
('Kiribati', 'KIR'),
('Kuwait', 'KWT'),
('Kyrgyzstan', 'KGZ'),
('Laos', 'LAO'),
('Latvia', 'LVA'),
('Lebanon', 'LBN'),
('Lesotho', 'LSO'),
('Liberia', 'LBR'),
('Libya', 'LBY'),
('Liechtenstein', 'LIE'),
('Lithuania', 'LTU'),
('Luxembourg', 'LUX'),
('Madagascar', 'MDG'),
('Malawi', 'MWI'),
('Malaysia', 'MYS'),
('Maldives', 'MDV'),
('Mali', 'MLI'),
('Malta', 'MLT'),
('Marshall Islands', 'MHL'),
('Mauritania', 'MRT'),
('Mauritius', 'MUS'),
('Mexico', 'MEX'),
('Micronesia', 'FSM'),
('Moldova', 'MDA'),
('Monaco', 'MCO'),
('Mongolia', 'MNG'),
('Montenegro', 'MNE'),
('Morocco', 'MAR'),
('Mozambique', 'MOZ'),
('Myanmar', 'MMR'),
('Namibia', 'NAM'),
('Nauru', 'NRU'),
('Nepal', 'NPL'),
('Netherlands', 'NLD'),
('New Zealand', 'NZL'),
('Nicaragua', 'NIC'),
('Niger', 'NER'),
('Nigeria', 'NGA'),
('North Korea', 'PRK'),
('North Macedonia', 'MKD'),
('Norway', 'NOR'),
('Oman', 'OMN'),
('Pakistan', 'PAK'),
('Palau', 'PLW'),
('Palestine', 'PSE'),
('Panama', 'PAN'),
('Papua New Guinea', 'PNG'),
('Paraguay', 'PRY'),
('Peru', 'PER'),
('Philippines', 'PHL'),
('Poland', 'POL'),
('Portugal', 'PRT'),
('Qatar', 'QAT'),
('Romania', 'ROU'),
('Russia', 'RUS'),
('Rwanda', 'RWA'),
('Saint Kitts and Nevis', 'KNA'),
('Saint Lucia', 'LCA'),
('Saint Vincent and the Grenadines', 'VCT'),
('Samoa', 'WSM'),
('San Marino', 'SMR'),
('Sao Tome and Principe', 'STP'),
('Saudi Arabia', 'SAU'),
('Senegal', 'SEN'),
('Serbia', 'SRB'),
('Seychelles', 'SYC'),
('Sierra Leone', 'SLE'),
('Singapore', 'SGP'),
('Slovakia', 'SVK'),
('Slovenia', 'SVN'),
('Solomon Islands', 'SLB'),
('Somalia', 'SOM'),
('South Africa', 'ZAF'),
('South Korea', 'KOR'),
('South Sudan', 'SSD'),
('Spain', 'ESP'),
('Sri Lanka', 'LKA'),
('Sudan', 'SDN'),
('Suriname', 'SUR'),
('Sweden', 'SWE'),
('Switzerland', 'CHE'),
('Syria', 'SYR'),
('Taiwan', 'TWN'),
('Tajikistan', 'TJK'),
('Tanzania', 'TZA'),
('Thailand', 'THA'),
('Timor-Leste', 'TLS'),
('Togo', 'TGO'),
('Tonga', 'TON'),
('Trinidad and Tobago', 'TTO'),
('Tunisia', 'TUN'),
('Turkey', 'TUR'),
('Turkmenistan', 'TKM'),
('Tuvalu', 'TUV'),
('Uganda', 'UGA'),
('Ukraine', 'UKR'),
('United Arab Emirates', 'ARE'),
('United Kingdom', 'GBR'),
('United States', 'USA'),
('Uruguay', 'URY'),
('Uzbekistan', 'UZB'),
('Vanuatu', 'VUT'),
('Vatican City', 'VAT'),
('Venezuela', 'VEN'),
('Vietnam', 'VNM'),
('Yemen', 'YEM'),
('Zambia', 'ZMB'),
('Zimbabwe', 'ZWE')
ON CONFLICT (country_name) DO NOTHING;

-- Verify the data
SELECT COUNT(*) as total_countries FROM countries;
SELECT country_name, code FROM countries ORDER BY country_name LIMIT 10;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Countries table created and populated successfully!';
    RAISE NOTICE 'Total countries inserted: %', (SELECT COUNT(*) FROM countries);
END $$; 