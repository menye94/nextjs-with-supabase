# Hotel Setup Guide - Fix Room Name Checking Error

## Problem
You're encountering the error "Error checking room name: {}" when trying to add rooms in the hotel management system. This error occurs because the database schema for hotels and rooms is not properly set up.

## Solution

### Step 1: Run the Database Migration

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the entire contents of `supabase/migrations/002_fix_hotel_rooms_schema.sql`
4. Click "Run" to execute the migration

This migration will:
- Create all necessary hotel-related tables (`hotels`, `rooms`, `hotel_rooms`, etc.)
- Create the `check_room_name_exists` function
- Set up proper Row Level Security (RLS) policies
- Create necessary indexes for performance

### Step 2: Verify the Setup

After running the migration, verify that the following tables exist in your Supabase Table Editor:

- `hotels`
- `rooms`
- `hotel_rooms`
- `hotels_seasons`
- `hotel_meal_plans`
- `hotel_rates_option`
- `hotel_child_policy`
- `hotel_pricing_type`
- `hotel_rates`
- `hotel_category`
- `locations`

### Step 3: Test the Function

You can test if the `check_room_name_exists` function is working by running this query in the SQL Editor:

```sql
SELECT * FROM check_room_name_exists('Test Room');
```

This should return a result with `exists_globally`, `exists_in_company`, and `message` columns.

### Step 4: Add Sample Data (Optional)

If you want to test the system with sample data, you can run these queries:

```sql
-- Add a sample hotel category
INSERT INTO hotel_category (category_name) VALUES ('Standard Hotel') ON CONFLICT DO NOTHING;

-- Add a sample location
INSERT INTO locations (location_name) VALUES ('Sample City') ON CONFLICT DO NOTHING;

-- Add sample meal plans
INSERT INTO hotel_meal_plans (meal_plan_name) VALUES 
  ('Bed & Breakfast'),
  ('Half Board'),
  ('Full Board'),
  ('All Inclusive')
ON CONFLICT DO NOTHING;

-- Add sample rates options
INSERT INTO hotel_rates_option (option_name) VALUES 
  ('Standard Rate'),
  ('Early Bird'),
  ('Last Minute'),
  ('Group Rate')
ON CONFLICT DO NOTHING;

-- Add sample child policies
INSERT INTO hotel_child_policy (policy_name, min_age, max_age) VALUES 
  ('Infant (0-2 years)', 0, 2),
  ('Child (3-12 years)', 3, 12),
  ('Teenager (13-17 years)', 13, 17)
ON CONFLICT DO NOTHING;

-- Add sample pricing types
INSERT INTO hotel_pricing_type (name) VALUES 
  ('Per Night'),
  ('Per Person'),
  ('Per Room')
ON CONFLICT DO NOTHING;
```

### Step 5: Test the Application

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to the hotels section of your application
3. Try to add a new room
4. The room name checking should now work without errors

## Troubleshooting

### If you still get the error:

1. **Check if the function exists:**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'check_room_name_exists';
   ```

2. **Check if the rooms table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'rooms';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'rooms';
   ```

### If the migration fails:

1. Check the error message in the SQL Editor
2. Make sure you have the necessary permissions in your Supabase project
3. Try running the migration in smaller chunks if there are specific errors

### If you get permission errors:

1. Make sure you're logged into the correct Supabase project
2. Check that your user has the necessary permissions to create tables and functions
3. If using a free tier, ensure you haven't hit any limits

## Additional Notes

- The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- All tables have proper foreign key constraints and indexes
- Row Level Security is enabled on all tables to ensure data isolation
- The `check_room_name_exists` function is marked as `SECURITY DEFINER` to ensure it can access the necessary data

## Support

If you continue to experience issues after following this guide:

1. Check the browser console for detailed error messages
2. Check the Supabase logs in your dashboard
3. Verify that all environment variables are correctly set
4. Ensure your Supabase project is properly configured

The improved error handling in the application will now provide more specific error messages to help identify the exact issue. 