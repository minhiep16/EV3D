-- EVShare 3D - Phase 07 Extension: Member Management Migration
-- Adds removed_at for soft deletion, updates demo group ownership, and seeds test co-owners

-- 1. Add removed_at column to group_members for soft removal tracking
ALTER TABLE group_members ADD COLUMN removed_at TIMESTAMP NULL AFTER joined_at;

-- 2. Ensure demo group EV01 has designated creator (Nguyen Van A: cbd7b894-a6c6-4b51-81d0-9a344715755b)
UPDATE co_ownership_groups
SET created_by = 'cbd7b894-a6c6-4b51-81d0-9a344715755b'
WHERE id = '22222222-2222-2222-2222-222222222222' AND (created_by IS NULL OR created_by = '');

-- 3. Ensure Owner A has REPRESENTATIVE role in demo group
UPDATE group_members
SET member_role = 'REPRESENTATIVE'
WHERE group_id = '22222222-2222-2222-2222-222222222222'
  AND user_id = 'cbd7b894-a6c6-4b51-81d0-9a344715755b';

-- 4. Seed additional registered CO_OWNER users for dynamic member search/addition testing
-- Owner D: 00000000-0000-0000-0000-000000000014 (Pham Van D)
-- Owner E: 00000000-0000-0000-0000-000000000015 (Hoang Thi E)
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, status)
VALUES 
    ('00000000-0000-0000-0000-000000000014', 'owner_d@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Pham Van D', 'CO_OWNER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000015', 'owner_e@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Hoang Thi E', 'CO_OWNER', 'ACTIVE');
