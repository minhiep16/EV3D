-- EVShare 3D - Phase 18/19: Staff-Verified Vehicle Return & Energy Expense Integration

-- 1. Extend trips table with staff return verification columns
ALTER TABLE trips
    ADD COLUMN return_verified_by_user_id CHAR(36) NULL AFTER soc_consumed_percent,
    ADD COLUMN return_verified_at TIMESTAMP NULL AFTER return_verified_by_user_id,
    ADD COLUMN return_note VARCHAR(500) NULL AFTER return_verified_at,
    ADD CONSTRAINT fk_trips_verified_by FOREIGN KEY (return_verified_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD INDEX idx_trips_verified_at (return_verified_at);
