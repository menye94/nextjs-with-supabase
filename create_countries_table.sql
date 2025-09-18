-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(3) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- Enable Row Level Security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all users to read countries" ON countries
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert countries" ON countries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update countries" ON countries
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete countries" ON countries
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

-- Insert sample countries data
INSERT INTO countries (name, code) VALUES
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
  ('Cambodia', 'KHM'),
  ('Cameroon', 'CMR'),
  ('Canada', 'CAN'),
  ('Cape Verde', 'CPV'),
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
  ('East Timor', 'TLS'),
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
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE countries IS 'List of countries for customer data';
COMMENT ON COLUMN countries.id IS 'Primary key for countries table';
COMMENT ON COLUMN countries.name IS 'Full name of the country';
COMMENT ON COLUMN countries.code IS 'ISO 3-letter country code';
COMMENT ON COLUMN countries.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN countries.updated_at IS 'Timestamp when the record was last updated'; 