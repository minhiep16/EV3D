-- EVShare 3D - Phase 13/14 Extension: EV02 Stylized Vehicle and Independent Co-Ownership Migration
-- Adds EV02 vehicle, dedicated co-ownership group, memberships, shares, and demo operational trip

-- 1. Seed Vehicle EV02 (Stylized Interactive EV)
INSERT IGNORE INTO vehicles (
    id,
    name,
    brand,
    model,
    year,
    license_plate,
    vin,
    battery_capacity,
    current_battery_level,
    odometer,
    status,
    model_3d_url
) VALUES (
    '11111111-1111-1111-1111-111111111102',
    'EV02 Xe thử nghiệm tương tác',
    'EVShare',
    'EV02 Stylized EV',
    2026,
    '51F-678.90',
    'EVSHAREDEMO000002',
    65.00,
    92,
    4520.00,
    'AVAILABLE',
    '/models/ev02-stylized.glb'
);

-- 2. Seed Dedicated Independent Co-Ownership Group for EV02
INSERT IGNORE INTO co_ownership_groups (
    id,
    vehicle_id,
    name,
    status,
    created_by
) VALUES (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'EV02 Co-ownership Group',
    'ACTIVE',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b'
);

-- 3. Link EV02 to EV02 Co-ownership Group in group_vehicles
INSERT IGNORE INTO group_vehicles (
    id,
    group_id,
    vehicle_id,
    status
) VALUES (
    '55555555-5555-5555-5555-555555555502',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'ACTIVE'
);

-- 4. Seed Group Members for EV02 Co-Ownership Group
-- Owner A (Nguyen Van A): REPRESENTATIVE of EV02
INSERT IGNORE INTO group_members (
    id,
    group_id,
    user_id,
    member_role,
    status
) VALUES (
    '33333333-3333-3333-3333-333333333401',
    '22222222-2222-2222-2222-222222222202',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    'REPRESENTATIVE',
    'ACTIVE'
);

-- Owner B (Tran Thi B): MEMBER of EV02
INSERT IGNORE INTO group_members (
    id,
    group_id,
    user_id,
    member_role,
    status
) VALUES (
    '33333333-3333-3333-3333-333333333402',
    '22222222-2222-2222-2222-222222222202',
    '00000000-0000-0000-0000-000000000012',
    'MEMBER',
    'ACTIVE'
);

-- Owner C (Le Van C): MEMBER of EV02
INSERT IGNORE INTO group_members (
    id,
    group_id,
    user_id,
    member_role,
    status
) VALUES (
    '33333333-3333-3333-3333-333333333403',
    '22222222-2222-2222-2222-222222222202',
    '00000000-0000-0000-0000-000000000013',
    'MEMBER',
    'ACTIVE'
);

-- 5. Seed Independent Ownership Shares for EV02 (Owner A: 50%, Owner B: 30%, Owner C: 20%, Total: 100%)
INSERT IGNORE INTO ownership_shares (
    id,
    group_id,
    vehicle_id,
    member_id,
    percentage
) VALUES 
    ('44444444-4444-4444-4444-444444444501', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333401', 50.00),
    ('44444444-4444-4444-4444-444444444502', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333402', 30.00),
    ('44444444-4444-4444-4444-444444444503', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333403', 20.00);

-- 6. Seed Completed Demo Booking & Trip for EV02 (Enables Immediate STAFF Damage Mapping)
INSERT IGNORE INTO bookings (
    id,
    vehicle_id,
    user_id,
    start_time,
    end_time,
    status,
    purpose
) VALUES (
    '33333333-3333-3333-3333-333333333431',
    '11111111-1111-1111-1111-111111111102',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    '2026-09-25 08:00:00',
    '2026-09-25 11:00:00',
    'COMPLETED',
    'Chạy thử nghiệm xe EV02'
);

INSERT IGNORE INTO trips (
    id,
    booking_id,
    vehicle_id,
    user_id,
    status,
    started_at,
    ended_at,
    start_odometer,
    end_odometer,
    start_battery_level,
    end_battery_level
) VALUES (
    '66666666-6666-6666-6666-666666666602',
    '33333333-3333-3333-3333-333333333431',
    '11111111-1111-1111-1111-111111111102',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    'COMPLETED',
    '2026-09-25 08:05:00',
    '2026-09-25 11:00:00',
    4480.00,
    4520.00,
    98,
    92
);
