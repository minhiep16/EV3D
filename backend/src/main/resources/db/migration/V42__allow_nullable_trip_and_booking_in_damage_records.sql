-- EVShare 3D - Migration V42: Allow Nullable Trip and Booking in Damage Records
-- Supports standalone vehicle inspection defect recording and pre-service garage damages

ALTER TABLE damage_records
    MODIFY COLUMN trip_id CHAR(36) NULL,
    MODIFY COLUMN booking_id CHAR(36) NULL;

