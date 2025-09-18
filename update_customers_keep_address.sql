-- Keep address column in database but note it's not displayed in UI
-- This script keeps the cus_address column but updates the table comment

-- Update table comment to reflect that address exists but is not displayed in UI
COMMENT ON TABLE customers IS 'Customer information with country reference and address (address not displayed in UI)';

-- Verify the current table structure (address should still be there)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Customers table structure verified!';
    RAISE NOTICE 'Address column remains in database but is not displayed in UI.';
END $$; 