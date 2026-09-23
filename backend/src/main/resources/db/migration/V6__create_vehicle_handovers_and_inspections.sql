-- EVShare 3D - Phase 09 Vehicle Handovers & Check-in Schema and Seed Migration

-- 1. Vehicle Handovers Table
CREATE TABLE IF NOT EXISTS vehicle_handovers (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL UNIQUE,
    vehicle_id CHAR(36) NOT NULL,
    staff_id CHAR(36) NULL,
    co_owner_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PREPARATION',
    staff_prepared_at TIMESTAMP NULL,
    staff_handed_over_at TIMESTAMP NULL,
    owner_received_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_handovers_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_handovers_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_handovers_staff FOREIGN KEY (staff_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_handovers_co_owner FOREIGN KEY (co_owner_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_handovers_booking (booking_id),
    INDEX idx_handovers_vehicle (vehicle_id),
    INDEX idx_handovers_staff (staff_id),
    INDEX idx_handovers_co_owner (co_owner_id),
    INDEX idx_handovers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vehicle Inspections Table
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id CHAR(36) PRIMARY KEY,
    handover_id CHAR(36) NOT NULL,
    vehicle_part_code VARCHAR(50) NOT NULL,
    condition_status VARCHAR(30) NOT NULL,
    note VARCHAR(500) NULL,
    inspected_by CHAR(36) NOT NULL,
    inspected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inspections_handover FOREIGN KEY (handover_id) REFERENCES vehicle_handovers (id) ON DELETE CASCADE,
    CONSTRAINT fk_inspections_user FOREIGN KEY (inspected_by) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE KEY uk_handover_part (handover_id, vehicle_part_code),
    INDEX idx_inspections_handover (handover_id),
    INDEX idx_inspections_part (vehicle_part_code),
    INDEX idx_inspections_condition (condition_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed Demo Users for STAFF and ADMIN Roles (Password: Password123@)
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, status)
VALUES 
    ('00000000-0000-0000-0000-000000000021', 'staff@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Nguyen Van Staff', 'STAFF', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000031', 'admin@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'He Thong Admin', 'ADMIN', 'ACTIVE');

-- 4. Seed Initial Handover for EV01 Demo Booking (Tran Thi B - Owner B)
-- Booking: 33333333-3333-3333-3333-333333333331
INSERT IGNORE INTO vehicle_handovers (
    id,
    booking_id,
    vehicle_id,
    staff_id,
    co_owner_id,
    status
) VALUES (
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000012',
    'PENDING_PREPARATION'
);
