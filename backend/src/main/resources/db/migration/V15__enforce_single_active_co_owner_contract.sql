-- EVShare 3D - Phase 15: Enforce Single Active Co-Owner Contract Rule
-- Authoritative Business Invariant:
-- ONE CO_OWNER USER = MAXIMUM ONE ACTIVE CO-OWNERSHIP CONTRACT = MAXIMUM ONE ACTIVE VEHICLE
--
-- 1. Nguyen Van A (owner_a@evshare.com, cbd7b894-a6c6-4b51-81d0-9a344715755b) has exactly ONE active contract: EV01.
-- 2. EV01 uses model /models/ev-car.glb.
-- 3. Any duplicate active group memberships are marked INACTIVE with removed_at = CURRENT_TIMESTAMP for historical audit.

-- 1. Ensure EV01 (11111111-1111-1111-1111-111111111111) uses /models/ev-car.glb
UPDATE vehicles
SET model_3d_url = '/models/ev-car.glb'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 2. Ensure EV02 (11111111-1111-1111-1111-111111111102) preserves /models/ev02-stylized.glb
UPDATE vehicles
SET model_3d_url = '/models/ev02-stylized.glb'
WHERE id = '11111111-1111-1111-1111-111111111102';

-- 3. Soft-deactivate any active membership of Nguyen Van A in any group OTHER than EV01 group
UPDATE group_members
SET status = 'INACTIVE',
    removed_at = CURRENT_TIMESTAMP
WHERE user_id = 'cbd7b894-a6c6-4b51-81d0-9a344715755b'
  AND group_id != '22222222-2222-2222-2222-222222222222'
  AND status = 'ACTIVE';

-- 4. Soft-deactivate any duplicate active memberships across all users (preserve historical record, keep oldest active membership)
UPDATE group_members gm
JOIN (
    SELECT gm1.id
    FROM group_members gm1
    JOIN group_members gm2 
      ON gm1.user_id = gm2.user_id 
     AND gm1.id != gm2.id
     AND gm1.created_at > gm2.created_at
    WHERE gm1.status = 'ACTIVE' 
      AND gm2.status = 'ACTIVE'
) duplicate_members ON gm.id = duplicate_members.id
SET gm.status = 'INACTIVE', gm.removed_at = CURRENT_TIMESTAMP;

-- 5. Delete any ownership shares linked to inactive memberships
DELETE FROM ownership_shares
WHERE member_id IN (
    SELECT id FROM group_members WHERE status = 'INACTIVE' OR removed_at IS NOT NULL
);

-- 6. Guarantee EV01 canonical memberships (Nguyen Van A, Tran Thi B, Le Van C)
UPDATE group_members
SET status = 'ACTIVE',
    removed_at = NULL
WHERE group_id = '22222222-2222-2222-2222-222222222222'
  AND user_id IN (
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013'
  );

-- 7. Guarantee EV02 canonical memberships (Owner D, Owner E, Owner F)
UPDATE group_members
SET status = 'ACTIVE',
    removed_at = NULL
WHERE group_id = '22222222-2222-2222-2222-222222222202'
  AND user_id IN (
    '00000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000015',
    '00000000-0000-0000-0000-000000000016'
  );
