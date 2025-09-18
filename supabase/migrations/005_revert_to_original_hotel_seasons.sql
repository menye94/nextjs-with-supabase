-- Migration to revert back to original hotel_seasons structure
-- This removes the global seasons system and restores the original approach

-- Drop the global seasons system tables and functions
DROP VIEW IF EXISTS hotel_seasons_view;
DROP FUNCTION IF EXISTS copy_hotel_seasons(INT, INT);
DROP FUNCTION IF EXISTS get_hotel_seasons(INT);
DROP FUNCTION IF EXISTS assign_season_to_hotel(INT, INT);
DROP TABLE IF EXISTS hotel_season_assignments;
DROP TABLE IF EXISTS global_seasons;

-- Drop indexes related to global seasons
DROP INDEX IF EXISTS idx_global_seasons_active;
DROP INDEX IF EXISTS idx_global_seasons_dates;
DROP INDEX IF EXISTS idx_hotel_season_assignments_hotel;
DROP INDEX IF EXISTS idx_hotel_season_assignments_season;
DROP INDEX IF EXISTS idx_hotel_season_assignments_active;

-- Ensure the original hotels_seasons table exists with correct structure
-- (This should already exist from the original migration, but ensuring it's correct)
CREATE TABLE IF NOT EXISTS hotels_seasons (
  id SERIAL NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  season_name VARCHAR NOT NULL,
  hotel_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_hotels_seasons_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  CONSTRAINT hotel_seasons UNIQUE (start_date, end_date, hotel_id)
);

-- Ensure the original index exists
CREATE INDEX IF NOT EXISTS idx_hotels_seasons_hotel_id ON hotels_seasons(hotel_id);

-- Add comment for documentation
COMMENT ON TABLE hotels_seasons IS 'Original hotel seasons table - each hotel has its own seasons'; 