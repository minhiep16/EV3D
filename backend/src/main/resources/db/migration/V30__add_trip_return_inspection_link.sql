-- EVShare 3D - Migration V30: Add Return Inspection Link to Trips
-- Links post-trip staff inspection records with trips table

ALTER TABLE trips
    ADD COLUMN return_inspection_id CHAR(36) NULL AFTER return_note,
    ADD CONSTRAINT fk_trips_return_inspection FOREIGN KEY (return_inspection_id) REFERENCES vehicle_inspections (id) ON DELETE SET NULL,
    ADD INDEX idx_trips_return_inspection (return_inspection_id);
