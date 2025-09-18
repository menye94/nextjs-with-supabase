-- Fix the unique constraint on hotel_rates table to include hotel_season_id
-- This prevents duplicate rates for the same hotel, room, season, meal plan, etc.

-- Drop the existing constraint
ALTER TABLE hotel_rates DROP CONSTRAINT IF EXISTS unique_hotel_rate_combination;

-- Add the corrected constraint that includes hotel_season_id
ALTER TABLE hotel_rates ADD CONSTRAINT unique_hotel_rate_combination 
UNIQUE (hotel_id, hotel_room_id, hotel_season_id, meal_plan_id, hotel_rates_option_id, entry_type_id, hotel_pricing_type_id);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT unique_hotel_rate_combination ON hotel_rates IS 
'Ensures no duplicate rates for the same hotel, room, season, meal plan, rates option, entry type, and pricing type combination'; 