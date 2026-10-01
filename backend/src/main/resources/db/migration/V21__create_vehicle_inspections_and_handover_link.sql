-- EVShare 3D - Migration V21: Standalone Vehicle Inspection Records and Handover Link
-- Decouples vehicle inspection from handover and establishes persistent inspection records

-- 1. Rename legacy handover inspections table if exists
RENAME TABLE vehicle_inspections TO legacy_handover_inspections;

-- 2. Create authoritative standalone vehicle inspections table
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL,
    inspected_by CHAR(36) NOT NULL,
    inspection_type VARCHAR(30) NOT NULL DEFAULT 'PRE_HANDOVER',
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    overall_result VARCHAR(30) NULL,
    summary_note VARCHAR(1000) NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_inspections_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_inspections_user FOREIGN KEY (inspected_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_vehicle_inspections_vehicle (vehicle_id),
    INDEX idx_vehicle_inspections_status (status),
    INDEX idx_vehicle_inspections_type (inspection_type),
    INDEX idx_vehicle_inspections_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create vehicle inspection items table
CREATE TABLE IF NOT EXISTS vehicle_inspection_items (
    id CHAR(36) PRIMARY KEY,
    inspection_id CHAR(36) NOT NULL,
    vehicle_part_code VARCHAR(50) NOT NULL,
    condition_status VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    note VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inspection_items_inspection FOREIGN KEY (inspection_id) REFERENCES vehicle_inspections (id) ON DELETE CASCADE,
    INDEX idx_inspection_items_inspection (inspection_id),
    INDEX idx_inspection_items_part (vehicle_part_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Add inspection snapshot link to vehicle handovers
ALTER TABLE vehicle_handovers ADD COLUMN inspection_id CHAR(36) NULL;
ALTER TABLE vehicle_handovers ADD CONSTRAINT fk_handovers_inspection FOREIGN KEY (inspection_id) REFERENCES vehicle_inspections (id) ON DELETE SET NULL;
CREATE INDEX idx_handovers_inspection ON vehicle_handovers (inspection_id);

