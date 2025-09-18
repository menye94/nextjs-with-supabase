-- Update customers table to remove address column
-- This script removes the cus_address column and keeps only country_id

-- Remove the address column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS cus_address;

-- Verify the updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Update table comment to reflect the change
COMMENT ON TABLE customers IS 'Customer information with country reference instead of address';

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Customers table updated successfully! Address column removed.';
    RAISE NOTICE 'Customers now use country_id for location information.';
END $$; 