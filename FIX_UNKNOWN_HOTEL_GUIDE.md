# Fix "Unknown Hotel" Issue in Hotel Seasons Table

## Problem
You can see hotel seasons in Supabase, but the hotel names are showing as "Unknown Hotel" in the frontend table.

## Root Causes
This issue typically occurs due to one of these reasons:

1. **No hotels exist** in the database
2. **Foreign key relationship** is broken (hotel_id doesn't match any hotel)
3. **RLS (Row Level Security)** policies are blocking access to hotel data
4. **Hotel data exists** but the user doesn't have permission to access it

## Step-by-Step Solution

### Step 1: Run the Diagnostic Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `debug_hotel_seasons.sql`
4. Click **Run**

This will show you:
- How many hotels exist
- How many seasons exist
- Whether foreign keys are properly set up
- If there are orphaned seasons
- RLS policy information
- User access permissions

### Step 2: Analyze the Results

Look for these key indicators:

**If you see "0 total_hotels":**
- You need to create hotels first

**If you see "MISSING HOTEL" in orphaned seasons:**
- The hotel_id in seasons doesn't match any existing hotel

**If you see "0 accessible_hotels" in user access test:**
- RLS policies are blocking access

### Step 3: Add the Debug Component (Temporary)

Add this to your hotel seasons page to see real-time data:

```tsx
// In your hotel seasons page, add this temporarily
import { HotelDebug } from '@/components/hotels/hotel-debug';

// Add this to your JSX
<HotelDebug />
```

### Step 4: Fix Based on Diagnosis

#### Option A: No Hotels Exist
If the diagnostic shows 0 hotels:

1. Run the fix script (`fix_hotel_seasons.sql`)
2. Uncomment the hotel creation section
3. Replace `YOUR_COMPANY_ID` with your actual company ID from step 1

#### Option B: Orphaned Seasons
If seasons exist but hotels don't match:

1. Run the fix script
2. Uncomment the linking section
3. This will create a default hotel and link all seasons to it

#### Option C: RLS Policy Issue
If hotels exist but user can't access them:

1. Check RLS policies in Supabase Dashboard
2. Ensure the policy allows the current user to read hotels
3. The policy should look something like:
   ```sql
   CREATE POLICY "Users can view own hotels" ON hotels
     FOR SELECT USING (
       owner_id IN (
         SELECT id FROM companies WHERE owner_id = auth.uid()
       )
     );
   ```

### Step 5: Verify the Fix

1. **Check the debug component** - it should show hotels and proper hotel names
2. **Refresh your hotel seasons page** - hotel names should now appear
3. **Check browser console** - look for any errors in the debug logs

### Step 6: Remove Debug Code

Once the issue is fixed:

1. Remove the `HotelDebug` component from your page
2. Remove the console.log statements from `hotel-seasons-table.tsx`

## Common Solutions

### Quick Fix: Add Sample Hotels
If you just need to get it working quickly:

```sql
-- Get your company ID first
SELECT id FROM companies WHERE owner_id = auth.uid() LIMIT 1;

-- Add hotels (replace YOUR_COMPANY_ID with actual ID)
INSERT INTO hotels (hotel_name, owner_id, is_active) VALUES
  ('Grand Hotel & Spa', 'YOUR_COMPANY_ID', true),
  ('Seaside Resort', 'YOUR_COMPANY_ID', true),
  ('Mountain Lodge', 'YOUR_COMPANY_ID', true);
```

### Link Existing Seasons to Hotels
If you have seasons but no hotels:

```sql
-- Create a default hotel
INSERT INTO hotels (hotel_name, owner_id, is_active) 
VALUES ('Default Hotel', (SELECT id FROM companies WHERE owner_id = auth.uid() LIMIT 1), true)
RETURNING id;

-- Link all seasons to this hotel
UPDATE hotels_seasons 
SET hotel_id = (SELECT id FROM hotels LIMIT 1)
WHERE hotel_id IS NULL OR hotel_id NOT IN (SELECT id FROM hotels);
```

## Troubleshooting

### Still seeing "Unknown Hotel" after fixes?

1. **Check browser console** for JavaScript errors
2. **Verify Supabase connection** is working
3. **Check RLS policies** are not blocking access
4. **Ensure user authentication** is working properly
5. **Clear browser cache** and refresh

### RLS Policy Issues

If RLS is blocking access, you can temporarily disable it for testing:

```sql
-- Temporarily disable RLS (for testing only)
ALTER TABLE hotels DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
```

## Expected Result

After the fix, you should see:
- Hotel names like "Grand Hotel & Spa" instead of "Unknown Hotel"
- Hotel filter dropdown populated with hotel names
- Ability to create seasons with proper hotel selection
- Debug component showing green checkmarks

## Next Steps

Once hotel names are showing correctly:

1. Remove the debug component
2. Remove console.log statements
3. Test the full season management functionality
4. Verify bulk operations work with proper hotel data 