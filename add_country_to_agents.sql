-- Add country_id field to agents table
-- This script adds country support to agents similar to customers

-- Add country_id column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);

-- Create index for country_id
CREATE INDEX IF NOT EXISTS idx_agents_country_id ON agents(country_id);

-- Update table comment to reflect the change
COMMENT ON COLUMN agents.country_id IS 'Reference to the agent country';

-- Verify the updated table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'agents'
ORDER BY ordinal_position;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added country_id field to agents table!';
    RAISE NOTICE 'Agents now support country selection like customers.';
END $$; 