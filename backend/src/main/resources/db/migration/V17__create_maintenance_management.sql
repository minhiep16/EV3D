-- EVShare 3D - Phase 15 Vehicle Maintenance Management Migration

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    maintenance_type VARCHAR(50) NOT NULL DEFAULT 'PREVENTIVE',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_by_user_id CHAR(36) NOT NULL,
    assigned_staff_id CHAR(36) NULL,
    completion_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_assigned_staff FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_maintenance_vehicle (vehicle_id),
    INDEX idx_maintenance_status (status),
    INDEX idx_maintenance_priority (priority),
    INDEX idx_maintenance_type (maintenance_type),
    INDEX idx_maintenance_scheduled (scheduled_at),
    INDEX idx_maintenance_staff (assigned_staff_id),
    INDEX idx_maintenance_created_by (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_request_damages (
    maintenance_request_id CHAR(36) NOT NULL,
    damage_record_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (maintenance_request_id, damage_record_id),
    CONSTRAINT fk_mrd_maintenance FOREIGN KEY (maintenance_request_id) REFERENCES maintenance_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_mrd_damage FOREIGN KEY (damage_record_id) REFERENCES damage_records (id) ON DELETE CASCADE,
    INDEX idx_mrd_damage (damage_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
