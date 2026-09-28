-- EVShare 3D - Phase 07/14 Refactoring: Enforce One Co-Ownership Group = Exactly One Vehicle
-- Isolates EV01 and EV02 into distinct co-ownership groups with independent demo members
-- Adds database unique constraints ensuring a group has at most 1 vehicle, and a vehicle has at most 1 group

-- 1. Seed demo user Owner F (Vu Van F) for EV02 Co-ownership Group
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000016',
    'owner_f@evshare.com',
    '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW',
    'Vu Van F',
    'CO_OWNER',
    'ACTIVE'
);

-- 2. Update EV02 Co-Ownership Group creator to Owner D (Pham Van D)
UPDATE co_ownership_groups
SET created_by = '00000000-0000-0000-0000-000000000014'
WHERE id = '22222222-2222-2222-2222-222222222202';

-- 3. Isolate EV02 Group Memberships to Owner D, Owner E, Owner F (Removing Nguyen Van A, Tran Thi B, Le Van C from EV02)
-- Owner D: REPRESENTATIVE with 50% ownership share
UPDATE group_members
SET user_id = '00000000-0000-0000-0000-000000000014',
    member_role = 'REPRESENTATIVE',
    status = 'ACTIVE'
WHERE id = '33333333-3333-3333-3333-333333333401';

-- Owner E: MEMBER with 30% ownership share
UPDATE group_members
SET user_id = '00000000-0000-0000-0000-000000000015',
    member_role = 'MEMBER',
    status = 'ACTIVE'
WHERE id = '33333333-3333-3333-3333-333333333402';

-- Owner F: MEMBER with 20% ownership share
UPDATE group_members
SET user_id = '00000000-0000-0000-0000-000000000016',
    member_role = 'MEMBER',
    status = 'ACTIVE'
WHERE id = '33333333-3333-3333-3333-333333333403';

-- 4. Reassign EV02 Demo Operational Booking and Trip to Owner D
UPDATE bookings
SET user_id = '00000000-0000-0000-0000-000000000014'
WHERE id = '33333333-3333-3333-3333-333333333431';

UPDATE trips
SET user_id = '00000000-0000-0000-0000-000000000014'
WHERE id = '66666666-6666-6666-6666-666666666602';

-- 5. Add Database Invariant Constraints for One Group = Exactly One Vehicle
-- Guarantee at most one vehicle per group in group_vehicles
ALTER TABLE group_vehicles ADD CONSTRAINT uk_group_vehicles_group UNIQUE (group_id);

-- Guarantee at most one group per vehicle in group_vehicles
ALTER TABLE group_vehicles ADD CONSTRAINT uk_group_vehicles_vehicle UNIQUE (vehicle_id);

-- Guarantee vehicle_id uniqueness on co_ownership_groups
ALTER TABLE co_ownership_groups ADD CONSTRAINT uk_co_ownership_groups_vehicle UNIQUE (vehicle_id);
