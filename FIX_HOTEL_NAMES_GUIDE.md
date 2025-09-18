# Fix Hotel Names in Hotel Seasons Table

## Problem
The hotel seasons table is showing "Unknown Hotel" for all seasons instead of the actual hotel names.

## Root Cause Analysis

The issue is likely caused by one or more of the following:

1. **No hotels in the database** - The hotels table is empty
2. **Foreign key relationship issues** - The hotel_id in seasons doesn't match any hotel
3. **RLS (Row Level Security) issues** - Policies preventing access to hotel data
4. **Query issues** - The JOIN query is not working properly

## Solution Steps

### Step 1: Check Database State

Run the diagnostic SQL script to check your database:

```sql
-- Copy and paste the contents of check_hotels_data.sql into your Supabase SQL Editor
-- This will check if hotels exist and add sample data if needed
```

### Step 2: Verify Hotel Data

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Check if the `hotels` table exists and has data
4. Check if the `hotels_seasons` table exists and has data

### Step 3: Add Sample Hotels (if needed)

If no hotels exist, run this SQL:

```sql
-- Get your company ID first
SELECT id FROM companies WHERE owner_id = auth.uid() LIMIT 1;

-- Add sample hotels (replace YOUR_COMPANY_ID with actual ID)
INSERT INTO hotels (hotel_name, owner_id, is_active) VALUES
  ('Grand Hotel & Spa', 'YOUR_COMPANY_ID', true),
  ('Seaside Resort', 'YOUR_COMPANY_ID', true),
  ('Mountain Lodge', 'YOUR_COMPANY_ID', true),
  ('City Center Hotel', 'YOUR_COMPANY_ID', true),
  ('Beachfront Resort', 'YOUR_COMPANY_ID', true);
```

### Step 4: Update Existing Seasons

If you have seasons but no hotels, you need to either:

**Option A: Create hotels and link existing seasons**
```sql
-- First create hotels, then update seasons to reference them
UPDATE hotels_seasons 
SET hotel_id = (SELECT id FROM hotels LIMIT 1)
WHERE hotel_id IS NULL OR hotel_id NOT IN (SELECT id FROM hotels);
```

**Option B: Delete seasons and recreate them with proper hotel references**
```sql
-- Delete existing seasons
DELETE FROM hotels_seasons;

-- Then create new seasons through the UI with proper hotel selection
```

### Step 5: Test the Fix

1. **Add the debug component** to your page temporarily:

```tsx
// In your hotel seasons page, add this temporarily
import { HotelDebug } from '@/components/hotels/hotel-debug';

// Add this to your JSX
<HotelDebug />
```

2. **Check browser console** for the debug logs we added
3. **Verify the data** shows proper hotel names

### Step 6: Remove Debug Code

Once the issue is fixed, remove the debug logs from `hotel-seasons-table.tsx`:

```tsx
// Remove these lines from fetchSeasons function:
console.log('Fetched seasons data:', data);

// Remove these lines from fetchHotels function:
console.log('Fetched hotels data:', data);
```

## Common Issues and Solutions

### Issue 1: "No hotels found" error
**Solution**: Run the sample hotel creation SQL above

### Issue 2: "Foreign key constraint" error
**Solution**: Ensure hotel_id values in seasons table match existing hotel IDs

### Issue 3: "RLS policy" error
**Solution**: Check that RLS policies allow reading hotel data

### Issue 4: "Table doesn't exist" error
**Solution**: Run the migration script from `supabase/migrations/002_fix_hotel_rooms_schema.sql`

## Verification Steps

After implementing the fix:

1. **Check the debug component** shows hotels and seasons
2. **Verify hotel names appear** in the seasons table
3. **Test creating a new season** with hotel selection
4. **Check that hotel filter** dropdown shows hotels

## Expected Result

After the fix, you should see:
- Hotel names like "Grand Hotel & Spa" instead of "Unknown Hotel"
- Hotel filter dropdown populated with hotel names
- Ability to create seasons with proper hotel selection

## Troubleshooting

If the issue persists:

1. **Check browser console** for any errors
2. **Verify Supabase connection** is working
3. **Check RLS policies** are not blocking access
4. **Ensure user authentication** is working properly

## Next Steps

Once hotel names are showing correctly:

1. Remove the debug component
2. Remove console.log statements
3. Test the full season management functionality
4. Verify bulk operations work with proper hotel data 