-- EVShare 3D - Phase 10-12: Vehicle Return Request Tracking
ALTER TABLE trips
    ADD COLUMN return_requested_at TIMESTAMP NULL AFTER return_verified_at,
    ADD INDEX idx_trips_return_requested_at (return_requested_at);
