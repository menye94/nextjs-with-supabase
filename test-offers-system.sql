-- =====================================================
-- OFFERS SYSTEM TESTING SCRIPT
-- =====================================================
-- This script tests the offers and contracts system
-- Run this in your Supabase SQL editor to test functionality

-- =====================================================
-- STEP 1: Check if tables exist and have data
-- =====================================================

-- Check offers table
SELECT 'Offers Table' as table_name, COUNT(*) as record_count 
FROM offer;

-- Check promotional offers table
SELECT 'Promo Offers Table' as table_name, COUNT(*) as record_count 
FROM promo_offer;

-- Check contract table
SELECT 'Contracts Table' as table_name, COUNT(*) as record_count 
FROM contract;

-- Check junction tables
SELECT 'Offer Crew Services' as table_name, COUNT(*) as record_count 
FROM offer_crew_services;

SELECT 'Offer Hotel Services' as table_name, COUNT(*) as record_count 
FROM offer_hotel_services;

SELECT 'Offer Transport Services' as table_name, COUNT(*) as record_count 
FROM offer_transport_services;

-- =====================================================
-- STEP 2: Test data creation (SAFE TESTING)
-- =====================================================

-- First, let's see what companies exist
SELECT id, company_name FROM companies LIMIT 5;

-- Let's see what customers exist
SELECT id, cus_first_name, cus_last_name, cus_email_address 
FROM customers 
LIMIT 5;

-- Let's see what agents exist
SELECT id, agent_name, agent_code 
FROM agents 
LIMIT 5;

-- Let's see what crew products exist
SELECT 
    cp.id,
    cp.price,
    cc.name as category_name,
    c.currency_name
FROM crew_product cp
JOIN crew_category cc ON cp.category_id = cc.id
JOIN currency c ON cp.currency_id = c.id
LIMIT 5;

-- =====================================================
-- STEP 3: Create test data (SAFE - uses TEST prefix)
-- =====================================================

-- Create a test offer (replace company_id with actual ID from step 2)
-- INSERT INTO offer (
--     offer_code,
--     offer_name,
--     active_from,
--     agent_id,
--     customer_id,
--     owner_id
-- ) VALUES (
--     'TEST001',
--     'Safari Package Test 2024',
--     '2024-01-01',
--     1, -- Replace with actual agent_id
--     1, -- Replace with actual customer_id
--     'your-company-uuid-here' -- Replace with actual company_id
-- );

-- Create a test promotional offer
-- INSERT INTO promo_offer (
--     promo_offer_code,
--     promo_offer_name,
--     active_from,
--     active_to,
--     description,
--     discount_type,
--     discount_value,
--     min_order_amount,
--     usage_limit,
--     owner_id
-- ) VALUES (
--     'PROMO001',
--     'Test Summer Sale 2024',
--     '2024-06-01',
--     '2024-08-31',
--     'Test promotional offer for testing purposes',
--     'percentage',
--     15.00,
--     100.00,
--     50,
--     'your-company-uuid-here' -- Replace with actual company_id
-- );

-- =====================================================
-- STEP 4: Test utility functions
-- =====================================================

-- Test offer code generation
SELECT generate_offer_code() as new_offer_code;

-- Test contract code generation
SELECT generate_contract_code() as new_contract_code;

-- Test promotional offer code generation
SELECT generate_promo_offer_code() as new_promo_code;

-- =====================================================
-- STEP 5: Test views (if they exist)
-- =====================================================

-- Test offers with totals view
-- SELECT * FROM offers_with_totals LIMIT 5;

-- Test contracts with details view
-- SELECT * FROM contracts_with_details LIMIT 5;

-- =====================================================
-- STEP 6: Cleanup test data (SAFE - only removes TEST data)
-- =====================================================

-- Remove test offers (uncomment when ready to clean up)
-- DELETE FROM offer WHERE offer_code LIKE 'TEST%';

-- Remove test promotional offers (uncomment when ready to clean up)
-- DELETE FROM promo_offer WHERE promo_offer_code LIKE 'PROMO%';

-- =====================================================
-- STEP 7: Verify cleanup
-- =====================================================

-- After cleanup, verify test data is gone
-- SELECT 'After Cleanup - Offers' as status, COUNT(*) as count 
-- FROM offer WHERE offer_code LIKE 'TEST%';

-- SELECT 'After Cleanup - Promo Offers' as status, COUNT(*) as count 
-- FROM promo_offer WHERE promo_offer_code LIKE 'PROMO%';

-- =====================================================
-- NOTES FOR TESTING:
-- =====================================================
-- 1. Replace 'your-company-uuid-here' with actual company ID
-- 2. Replace agent_id and customer_id with actual IDs from your data
-- 3. Run sections step by step to test functionality
-- 4. Use the cleanup section to remove test data when done
-- 5. Check the console for any error messages
-- 6. Verify that RLS policies are working correctly
