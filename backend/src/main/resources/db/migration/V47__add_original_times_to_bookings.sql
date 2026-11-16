-- EVShare 3D - Add original scheduled booking times for historical audit and early return slot release
ALTER TABLE bookings
ADD COLUMN original_start_time TIMESTAMP NULL AFTER end_time,
ADD COLUMN original_end_time TIMESTAMP NULL AFTER original_start_time;

-- Backfill existing records
UPDATE bookings
SET original_start_time = start_time,
    original_end_time = end_time
WHERE original_start_time IS NULL;
