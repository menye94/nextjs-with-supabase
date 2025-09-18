-- Update constraint for hotel_child_policy table
-- This allows multiple policies for the same hotel with the same age range
-- but only if the adult_sharing value is different

-- Drop the existing constraint
ALTER TABLE hotel_child_policy 
DROP CONSTRAINT IF EXISTS unique_hotel_age_range;

-- Add the new constraint that includes adult_sharing
ALTER TABLE hotel_child_policy 
ADD CONSTRAINT unique_hotel_age_range_sharing 
UNIQUE (hotel_id, min_age, max_age, adult_sharing);

-- Verify the constraint was added successfully
-- You can check this in Supabase dashboard under Table Editor > hotel_child_policy > Constraints 