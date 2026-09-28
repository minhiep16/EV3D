-- EVShare 3D - Phase 14: Correct EV02 Co-Owner Membership & Isolate Nguyen Van A to EV01 Only
-- Authoritative Business Rules:
-- 1. Nguyen Van A (owner_a@evshare.com, cbd7b894-a6c6-4b51-81d0-9a344715755b) co-owns EV01 ONLY.
-- 2. EV02 (11111111-1111-1111-1111-111111111102) is co-owned exclusively by Owner D, Owner E, and Owner F.
-- 3. 1 CoOwnershipGroup = exactly 1 Vehicle. No group may link to multiple vehicles.

-- 1. Ensure demo users Owner D, Owner E, Owner F exist in users table
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, status)
VALUES 
    ('00000000-0000-0000-0000-000000000014', 'owner_d@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Pham Van D', 'CO_OWNER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000015', 'owner_e@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Hoang Thi E', 'CO_OWNER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000016', 'owner_f@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Vu Van F', 'CO_OWNER', 'ACTIVE');

-- 2. Clean up group_vehicles table: Enforce strict 1-to-1 isolation
-- Ensure EV01 group links ONLY to EV01
DELETE FROM group_vehicles 
WHERE group_id = '22222222-2222-2222-2222-222222222222' 
  AND vehicle_id != '11111111-1111-1111-1111-111111111111';

-- Ensure EV02 group links ONLY to EV02
DELETE FROM group_vehicles 
WHERE group_id = '22222222-2222-2222-2222-222222222202' 
  AND vehicle_id != '11111111-1111-1111-1111-111111111102';

-- Ensure EV02 is never linked to EV01's group
DELETE FROM group_vehicles 
WHERE vehicle_id = '11111111-1111-1111-1111-111111111102' 
  AND group_id != '22222222-2222-2222-2222-222222222202';

-- Ensure EV01 is never linked to EV02's group
DELETE FROM group_vehicles 
WHERE vehicle_id = '11111111-1111-1111-1111-111111111111' 
  AND group_id != '22222222-2222-2222-2222-222222222222';

-- Re-assert canonical group_vehicles mappings
INSERT IGNORE INTO group_vehicles (id, group_id, vehicle_id, status)
VALUES 
    ('55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'ACTIVE'),
    ('55555555-5555-5555-5555-555555555502', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'ACTIVE');

-- 3. Assert canonical co_ownership_groups vehicle_id and created_by
UPDATE co_ownership_groups
SET vehicle_id = '11111111-1111-1111-1111-111111111111',
    created_by = 'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    status = 'ACTIVE'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE co_ownership_groups
SET vehicle_id = '11111111-1111-1111-1111-111111111102',
    created_by = '00000000-0000-0000-0000-000000000014',
    status = 'ACTIVE'
WHERE id = '22222222-2222-2222-2222-222222222202';

-- 4. Purge any ownership shares on EV02 belonging to Nguyen Van A, Tran Thi B, or Le Van C
DELETE FROM ownership_shares
WHERE group_id = '22222222-2222-2222-2222-222222222202'
  AND member_id IN (
    SELECT id FROM (
      SELECT id FROM group_members
      WHERE group_id = '22222222-2222-2222-2222-222222222202'
        AND user_id IN (
          'cbd7b894-a6c6-4b51-81d0-9a344715755b',
          '00000000-0000-0000-0000-000000000012',
          '00000000-0000-0000-0000-000000000013'
        )
    ) AS tmp_ev02_members
  );

-- 5. Purge all group memberships of Nguyen Van A, Tran Thi B, Le Van C from EV02 co-ownership group
DELETE FROM group_members
WHERE group_id = '22222222-2222-2222-2222-222222222202'
  AND user_id IN (
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013'
  );

-- 6. Guarantee EV02 group members: Owner D (Representative), Owner E, Owner F
INSERT INTO group_members (id, group_id, user_id, member_role, status)
VALUES ('33333333-3333-3333-3333-333333333401', '22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-000000000014', 'REPRESENTATIVE', 'ACTIVE')
ON DUPLICATE KEY UPDATE user_id = '00000000-0000-0000-0000-000000000014', member_role = 'REPRESENTATIVE', status = 'ACTIVE';

INSERT INTO group_members (id, group_id, user_id, member_role, status)
VALUES ('33333333-3333-3333-3333-333333333402', '22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-000000000015', 'MEMBER', 'ACTIVE')
ON DUPLICATE KEY UPDATE user_id = '00000000-0000-0000-0000-000000000015', member_role = 'MEMBER', status = 'ACTIVE';

INSERT INTO group_members (id, group_id, user_id, member_role, status)
VALUES ('33333333-3333-3333-3333-333333333403', '22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-000000000016', 'MEMBER', 'ACTIVE')
ON DUPLICATE KEY UPDATE user_id = '00000000-0000-0000-0000-000000000016', member_role = 'MEMBER', status = 'ACTIVE';

-- 7. Guarantee EV02 ownership shares: Owner D 50%, Owner E 30%, Owner F 20% (Total: 100%)
INSERT INTO ownership_shares (id, group_id, vehicle_id, member_id, percentage)
VALUES ('44444444-4444-4444-4444-444444444501', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333401', 50.00)
ON DUPLICATE KEY UPDATE percentage = 50.00, member_id = '33333333-3333-3333-3333-333333333401', vehicle_id = '11111111-1111-1111-1111-111111111102';

INSERT INTO ownership_shares (id, group_id, vehicle_id, member_id, percentage)
VALUES ('44444444-4444-4444-4444-444444444502', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333402', 30.00)
ON DUPLICATE KEY UPDATE percentage = 30.00, member_id = '33333333-3333-3333-3333-333333333402', vehicle_id = '11111111-1111-1111-1111-111111111102';

INSERT INTO ownership_shares (id, group_id, vehicle_id, member_id, percentage)
VALUES ('44444444-4444-4444-4444-444444444503', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333403', 20.00)
ON DUPLICATE KEY UPDATE percentage = 20.00, member_id = '33333333-3333-3333-3333-333333333403', vehicle_id = '11111111-1111-1111-1111-111111111102';

-- 8. Reassign EV02 Demo Operational Bookings & Trips to Owner D
UPDATE bookings
SET user_id = '00000000-0000-0000-0000-000000000014'
WHERE vehicle_id = '11111111-1111-1111-1111-111111111102';

UPDATE trips
SET user_id = '00000000-0000-0000-0000-000000000014'
WHERE vehicle_id = '11111111-1111-1111-1111-111111111102';
