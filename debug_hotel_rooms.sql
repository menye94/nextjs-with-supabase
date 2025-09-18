-- Debug script to check hotel_rooms table structure and data
-- This will help verify that hotel-specific rooms are being fetched correctly

-- 1. Check the hotel_rooms table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hotel_rooms'
ORDER BY ordinal_position;

-- 2. Check if there are any hotel_rooms records
SELECT COUNT(*) as total_hotel_rooms FROM hotel_rooms;

-- 3. Check the relationship between hotels and rooms
SELECT 
    hr.id as hotel_room_id,
    hr.hotel_id,
    h.hotel_name,
    hr.room_id,
    r.room_name
FROM hotel_rooms hr
JOIN hotels h ON hr.hotel_id = h.id
JOIN rooms r ON hr.room_id = r.id
ORDER BY h.hotel_name, r.room_name
LIMIT 20;

-- 4. Check how many rooms each hotel has
SELECT 
    h.id as hotel_id,
    h.hotel_name,
    COUNT(hr.id) as room_count
FROM hotels h
LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id
GROUP BY h.id, h.hotel_name
ORDER BY h.hotel_name;

-- 5. Check for any hotels without rooms
SELECT 
    h.id as hotel_id,
    h.hotel_name
FROM hotels h
LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id
WHERE hr.id IS NULL
ORDER BY h.hotel_name;

-- 6. Test the exact query used in the application
-- Replace '1' with an actual hotel ID from your database
SELECT 
    hr.id,
    r.room_name
FROM hotel_rooms hr
JOIN rooms r ON hr.room_id = r.id
WHERE hr.hotel_id = 1
ORDER BY r.room_name; 