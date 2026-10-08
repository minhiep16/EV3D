-- EVShare 3D - Phase 19: Usage and Capital Allocation Snapshots Migration

-- 1. Extend expense_shares table with calculation audit and snapshot fields
ALTER TABLE expense_shares
    ADD COLUMN allocation_policy VARCHAR(30) NULL AFTER status,
    ADD COLUMN member_km_snapshot DECIMAL(10, 2) NULL AFTER allocation_percentage,
    ADD COLUMN total_km_snapshot DECIMAL(10, 2) NULL AFTER member_km_snapshot,
    ADD COLUMN raw_calculated_amount DECIMAL(14, 2) NULL AFTER total_km_snapshot,
    ADD COLUMN redistribution_adjustment DECIMAL(14, 2) NULL AFTER raw_calculated_amount,
    ADD COLUMN allocation_period_start TIMESTAMP NULL AFTER redistribution_adjustment,
    ADD COLUMN allocation_period_end TIMESTAMP NULL AFTER allocation_period_start,
    ADD COLUMN calculation_version VARCHAR(20) NULL AFTER allocation_period_end,
    ADD INDEX idx_expense_shares_policy (allocation_policy);

-- 2. Backfill existing expense_shares: preserve historical integrity
UPDATE expense_shares es
JOIN expenses e ON es.expense_id = e.id
SET es.allocation_policy = e.allocation_policy,
    es.raw_calculated_amount = es.share_amount,
    es.redistribution_adjustment = 0.00,
    es.calculation_version = 'V1_LEGACY'
WHERE es.allocation_policy IS NULL;

-- 3. Seed demo October 2026 completed bookings and trips for EV01 (Acceptance Test B)
-- Co-owners of EV01:
-- Owner A (40%): cbd7b894-a6c6-4b51-81d0-9a344715755b (500 km)
-- Owner B (30%): 00000000-0000-0000-0000-000000000012 (300 km)
-- Owner C (30%): 00000000-0000-0000-0000-000000000013 (200 km)
-- Total km = 1,000 km

INSERT IGNORE INTO bookings (
    id,
    vehicle_id,
    user_id,
    start_time,
    end_time,
    status,
    purpose
) VALUES
    ('33333333-3333-3333-3333-333333334001', '11111111-1111-1111-1111-111111111111', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '2026-10-02 08:00:00', '2026-10-02 18:00:00', 'COMPLETED', 'Công tác Vũng Tàu'),
    ('33333333-3333-3333-3333-333333334002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000012', '2026-10-03 08:00:00', '2026-10-03 16:00:00', 'COMPLETED', 'Về quê Tiền Giang'),
    ('33333333-3333-3333-3333-333333334003', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000013', '2026-10-04 09:00:00', '2026-10-04 15:00:00', 'COMPLETED', 'Gặp đối tác Bình Dương');

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
) VALUES
    ('66666666-6666-6666-6666-666666664001', '33333333-3333-3333-3333-333333334001', '11111111-1111-1111-1111-111111111111', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', 'COMPLETED', '2026-10-02 08:05:00', '2026-10-02 17:50:00', 5000.00, 5500.00, 95, 45),
    ('66666666-6666-6666-6666-666666664002', '33333333-3333-3333-3333-333333334002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000012', 'COMPLETED', '2026-10-03 08:10:00', '2026-10-03 15:45:00', 5500.00, 5800.00, 90, 50),
    ('66666666-6666-6666-6666-666666664003', '33333333-3333-3333-3333-333333334003', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000013', 'COMPLETED', '2026-10-04 09:15:00', '2026-10-04 14:40:00', 5800.00, 6000.00, 85, 55);

-- 4. Update seed maintenance expense 0003 to demonstrate USAGE_AND_CAPITAL policy
-- Expense 0003: 1,450,000 VND (or 3,000,000 VND canonical model)
-- A: 40% capital, 500 km (50%) -> Raw & Final: 1,450,000 * (0.50 - 0.40 + 1/3) = 628,333 VND
-- B: 30% capital, 300 km (30%) -> Raw & Final: 1,450,000 * (0.30 - 0.30 + 1/3) = 483,333 VND
-- C: 30% capital, 200 km (20%) -> Raw & Final: 1,450,000 * (0.20 - 0.30 + 1/3) = 338,334 VND
-- Total = 1,450,000 VND exactly
UPDATE expenses
SET allocation_policy = 'USAGE_AND_CAPITAL'
WHERE id = '88888888-8888-8888-8888-888888880003';

UPDATE expense_shares
SET allocation_policy = 'USAGE_AND_CAPITAL',
    allocation_percentage = 43.3333,
    share_amount = 628333.00,
    member_km_snapshot = 500.00,
    total_km_snapshot = 1000.00,
    raw_calculated_amount = 628333.00,
    redistribution_adjustment = 0.00,
    allocation_period_start = '2026-10-01 00:00:00',
    allocation_period_end = '2026-11-01 00:00:00',
    calculation_version = 'V2'
WHERE expense_id = '88888888-8888-8888-8888-888888880003'
  AND user_id = 'cbd7b894-a6c6-4b51-81d0-9a344715755b';

UPDATE expense_shares
SET allocation_policy = 'USAGE_AND_CAPITAL',
    allocation_percentage = 33.3333,
    share_amount = 483333.00,
    member_km_snapshot = 300.00,
    total_km_snapshot = 1000.00,
    raw_calculated_amount = 483333.00,
    redistribution_adjustment = 0.00,
    allocation_period_start = '2026-10-01 00:00:00',
    allocation_period_end = '2026-11-01 00:00:00',
    calculation_version = 'V2'
WHERE expense_id = '88888888-8888-8888-8888-888888880003'
  AND user_id = '00000000-0000-0000-0000-000000000012';

UPDATE expense_shares
SET allocation_policy = 'USAGE_AND_CAPITAL',
    allocation_percentage = 23.3334,
    share_amount = 338334.00,
    member_km_snapshot = 200.00,
    total_km_snapshot = 1000.00,
    raw_calculated_amount = 338334.00,
    redistribution_adjustment = 0.00,
    allocation_period_start = '2026-10-01 00:00:00',
    allocation_period_end = '2026-11-01 00:00:00',
    calculation_version = 'V2'
WHERE expense_id = '88888888-8888-8888-8888-888888880003'
  AND user_id = '00000000-0000-0000-0000-000000000013';
