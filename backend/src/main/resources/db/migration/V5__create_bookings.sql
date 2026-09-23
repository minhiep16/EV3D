-- EVShare 3D - Phase 08 Bookings Schema and Seed Migration

CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    purpose VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_bookings_vehicle (vehicle_id),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_start_time (start_time),
    INDEX idx_bookings_end_time (end_time),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Demo Bookings for EV01 (Idempotent INSERT IGNORE)
-- 1. Booking on 2026-09-24 from 10:00 to 12:00 by Owner B (Tran Thi B)
INSERT IGNORE INTO bookings (
    id,
    vehicle_id,
    user_id,
    start_time,
    end_time,
    status,
    purpose
) VALUES (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000012',
    '2026-09-24 10:00:00',
    '2026-09-24 12:00:00',
    'CONFIRMED',
    'Đi gặp đối tác tại Quận 1'
);

-- 2. Booking on 2026-09-24 from 14:00 to 16:00 by Owner C (Le Van C)
INSERT IGNORE INTO bookings (
    id,
    vehicle_id,
    user_id,
    start_time,
    end_time,
    status,
    purpose
) VALUES (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000013',
    '2026-09-24 14:00:00',
    '2026-09-24 16:00:00',
    'CONFIRMED',
    'Đưa gia đình về quê ngoại'
);
