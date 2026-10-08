-- EVShare 3D - Phase 19: Expense Responsibility & Allocation Policy Refinement

-- 1. Extend expenses table with allocation policy, responsible user, and trip/booking relations
ALTER TABLE expenses
    ADD COLUMN allocation_policy VARCHAR(30) NOT NULL DEFAULT 'OWNERSHIP_RATIO' AFTER category,
    ADD COLUMN responsible_user_id CHAR(36) NULL AFTER paid_by_user_id,
    ADD COLUMN related_trip_id CHAR(36) NULL AFTER source_reference_id,
    ADD COLUMN related_booking_id CHAR(36) NULL AFTER related_trip_id,
    ADD CONSTRAINT fk_expenses_responsible_user FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD INDEX idx_expenses_policy (allocation_policy),
    ADD INDEX idx_expenses_responsible (responsible_user_id);

-- 2. Extend expense_shares table with allocation percentage
ALTER TABLE expense_shares
    ADD COLUMN allocation_percentage DECIMAL(7, 4) NULL AFTER ownership_percentage;

-- 3. Backfill legacy historical expense shares: preserve historical allocation equals ownership percentage
UPDATE expense_shares
SET allocation_percentage = ownership_percentage
WHERE allocation_percentage IS NULL;

-- 4. Update seed demo parking expense (0004) to demonstrate Case A: USER_RESPONSIBILITY with Nguyen Van A
-- Co-owners of EV01:
-- Owner A (40%): cbd7b894-a6c6-4b51-81d0-9a344715755b
-- Owner B (30%): 00000000-0000-0000-0000-000000000012
-- Owner C (30%): 00000000-0000-0000-0000-000000000013
UPDATE expenses
SET allocation_policy = 'USER_RESPONSIBILITY',
    responsible_user_id = 'cbd7b894-a6c6-4b51-81d0-9a344715755b'
WHERE id = '88888888-8888-8888-8888-888888880004';

-- Reallocate shares for the demo parking expense (150,000 VND) strictly according to CASE A:
-- Nguyen Van A: ownership 40%, allocation 100%, share 150,000 VND
-- Tran Thi B: ownership 30%, allocation 0%, share 0 VND
-- Le Van C: ownership 30%, allocation 0%, share 0 VND
UPDATE expense_shares
SET allocation_percentage = 100.0000, share_amount = 150000.00
WHERE expense_id = '88888888-8888-8888-8888-888888880004'
  AND user_id = 'cbd7b894-a6c6-4b51-81d0-9a344715755b';

UPDATE expense_shares
SET allocation_percentage = 0.0000, share_amount = 0.00
WHERE expense_id = '88888888-8888-8888-8888-888888880004'
  AND user_id IN ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000013');

-- Ensure Maintenance expense retains OWNERSHIP_RATIO
UPDATE expenses
SET allocation_policy = 'OWNERSHIP_RATIO'
WHERE id IN ('88888888-8888-8888-8888-888888880003', '88888888-8888-8888-8888-888888880002', '88888888-8888-8888-8888-888888880006');
