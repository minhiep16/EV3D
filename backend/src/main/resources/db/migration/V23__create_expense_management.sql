-- EVShare 3D - Phase 18: Expense Management Schema & Seed Migration

CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL,
    co_ownership_group_id CHAR(36) NULL,
    category VARCHAR(30) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    paid_by_user_id CHAR(36) NOT NULL,
    created_by_user_id CHAR(36) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'MANUAL',
    source_reference_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenses_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_co_ownership_group FOREIGN KEY (co_ownership_group_id) REFERENCES co_ownership_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_expenses_vehicle (vehicle_id),
    INDEX idx_expenses_occurred_at (occurred_at),
    INDEX idx_expenses_category (category),
    INDEX idx_expenses_paid_by (paid_by_user_id),
    INDEX idx_expenses_group (co_ownership_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Legitimate Vehicle Expenses for EV01 (Month 2026-10)
-- Total = 3,450,000 VND
INSERT IGNORE INTO expenses (
    id,
    vehicle_id,
    co_ownership_group_id,
    category,
    amount,
    description,
    occurred_at,
    paid_by_user_id,
    created_by_user_id,
    source_type,
    source_reference_id
) VALUES 
    (
        '88888888-8888-8888-8888-888888880001',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'CHARGING',
        185000.00,
        'Trạm sạc VinFast Landmark 81 — Sạc nhanh DC',
        '2026-10-03 14:30:00',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'CHARGING_SESSION',
        '77777777-7777-7777-7777-777777777701'
    ),
    (
        '88888888-8888-8888-8888-888888880002',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'CLEANING',
        120000.00,
        'Rửa xe bọt tuyết & hút bụi nội thất',
        '2026-10-02 10:15:00',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000012',
        'MANUAL',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888880003',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'MAINTENANCE',
        1450000.00,
        'Bảo dưỡng định kỳ cấp 1 (10.000 km)',
        '2026-10-01 09:00:00',
        '00000000-0000-0000-0000-000000000013',
        '00000000-0000-0000-0000-000000000013',
        'MAINTENANCE_REQUEST',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888880004',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'PARKING',
        150000.00,
        'Gửi xe hầm Vincom Center Đồng Khởi',
        '2026-10-02 21:00:00',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'MANUAL',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888880005',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'TOLL',
        78000.00,
        'Phí trạm thu phí cao tốc TP.HCM — Long Thành',
        '2026-10-01 16:45:00',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000012',
        'MANUAL',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888880006',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'INSURANCE',
        1467000.00,
        'Bảo hiểm vật chất xe cơ giới tháng 10/2026',
        '2026-10-01 08:30:00',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        'MANUAL',
        NULL
    );
