# Offers System Testing Guide

## 🧪 Testing Environment Setup

We've created a comprehensive testing environment for the offers and contracts system. Since we can't create a Supabase branch on the current plan, we'll test directly in the main database using safe testing practices.

## 🚀 How to Test

### Option 1: Web Interface Testing
1. **Navigate to the test page**: Go to `/offers-test` in your application
2. **Use the web interface** to create test offers and promotional offers
3. **Monitor the results** through the success/error messages
4. **Clean up test data** using the cleanup button when done

### Option 2: Direct Database Testing
1. **Open Supabase SQL Editor**
2. **Run the test script**: `test-offers-system.sql`
3. **Follow the step-by-step instructions** in the script
4. **Clean up test data** using the cleanup commands

## 🛡️ Safety Features

### Test Data Prefixes
- **Offers**: All test offers use `TEST` prefix (e.g., `TEST001`, `TEST002`)
- **Promotional Offers**: All test promos use `PROMO` prefix (e.g., `PROMO001`)
- **Easy Cleanup**: Can safely remove all test data using pattern matching

### RLS Protection
- All tables have Row Level Security enabled
- Test data is isolated to your company
- No risk of affecting other users' data

## 📋 Testing Checklist

### Phase 1: Basic Functionality ✅
- [x] Database tables created
- [x] TypeScript types defined
- [x] Utility functions implemented
- [x] Test interface created

### Phase 2: Core Testing (Next)
- [ ] Test offer creation
- [ ] Test promotional offer creation
- [ ] Test service linking
- [ ] Test price calculations
- [ ] Test utility functions

### Phase 3: Advanced Testing
- [ ] Test contract creation
- [ ] Test payment tracking
- [ ] Test discount application
- [ ] Test data relationships

## 🔧 Testing Commands

### Quick Database Check
```sql
-- Check if tables exist and have data
SELECT 'Offers' as table_name, COUNT(*) as count FROM offer
UNION ALL
SELECT 'Promo Offers', COUNT(*) FROM promo_offer
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contract;
```

### Test Code Generation
```sql
-- Test the utility functions
SELECT generate_offer_code() as new_offer_code;
SELECT generate_contract_code() as new_contract_code;
SELECT generate_promo_offer_code() as new_promo_code;
```

### Safe Test Data Creation
```sql
-- Create test offer (replace IDs with actual values)
INSERT INTO offer (
    offer_code, offer_name, active_from, agent_id, customer_id, owner_id
) VALUES (
    'TEST001', 'Safari Package Test', '2024-01-01', 1, 1, 'your-company-id'
);
```

## 🧹 Cleanup Commands

### Remove All Test Data
```sql
-- Remove test offers
DELETE FROM offer WHERE offer_code LIKE 'TEST%';

-- Remove test promotional offers
DELETE FROM promo_offer WHERE promo_offer_code LIKE 'PROMO%';

-- Verify cleanup
SELECT COUNT(*) as remaining_test_offers FROM offer WHERE offer_code LIKE 'TEST%';
SELECT COUNT(*) as remaining_test_promos FROM promo_offer WHERE promo_offer_code LIKE 'PROMO%';
```

## 🚨 Important Notes

### Before Testing
1. **Backup your data** if you have important production data
2. **Check company ID** - make sure you're using the correct company UUID
3. **Verify user permissions** - ensure you have access to create records

### During Testing
1. **Start small** - test one feature at a time
2. **Monitor logs** - check for any error messages
3. **Verify relationships** - ensure foreign keys are working correctly

### After Testing
1. **Clean up test data** - remove all test records
2. **Verify cleanup** - ensure no test data remains
3. **Document findings** - note any issues or improvements needed

## 🐛 Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Check if user has access to company data
2. **Foreign Key Errors**: Verify that referenced IDs exist
3. **Permission Errors**: Ensure user has INSERT/UPDATE/DELETE permissions

### Debug Commands
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('offer', 'promo_offer', 'contract');

-- Check table structure
\d offer
\d promo_offer
\d contract
```

## 📱 Web Interface Features

### Test Offer Creation
- **Form validation** - ensures all required fields are filled
- **Dropdown selection** - shows available customers, agents, and services
- **Real-time feedback** - success/error messages for all operations

### Data Overview
- **Counts display** - shows available customers, agents, and services
- **Sample data view** - displays actual data for verification
- **Safe testing** - all test data is clearly marked

### Cleanup Tools
- **One-click cleanup** - removes all test data safely
- **Verification** - confirms cleanup was successful
- **Pattern matching** - only removes data with TEST/PROMO prefixes

## 🎯 Next Steps

1. **Test basic functionality** using the web interface
2. **Verify database operations** using the SQL script
3. **Test service linking** by adding services to offers
4. **Test promotional features** with discount calculations
5. **Create production-ready interface** based on testing results

## 📞 Support

If you encounter any issues during testing:
1. Check the browser console for error messages
2. Verify database permissions and RLS policies
3. Check the Supabase logs for detailed error information
4. Review the migration files for any syntax issues

Happy testing! 🎉
