-- EVShare 3D - Phase 09 Add Owner Condition Acknowledged Timestamp
ALTER TABLE vehicle_handovers 
ADD COLUMN owner_condition_acknowledged_at TIMESTAMP NULL AFTER owner_received_at;
