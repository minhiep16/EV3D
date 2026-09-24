-- EVShare 3D - Phase 07 Co-Ownership Group-Based Refactoring
-- Transition from vehicle-centric co-ownership to group-centric co-ownership

-- 1. Refactor co_ownership_groups table
ALTER TABLE co_ownership_groups ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER name;
ALTER TABLE co_ownership_groups ADD COLUMN created_by CHAR(36) NULL AFTER status;
ALTER TABLE co_ownership_groups MODIFY COLUMN vehicle_id CHAR(36) NULL;
-- Drop unique constraint on vehicle_id so a group is not permanently 1-vehicle-only
ALTER TABLE co_ownership_groups DROP INDEX vehicle_id;

-- 2. Create group_vehicles table for explicit group-vehicle associations
CREATE TABLE IF NOT EXISTS group_vehicles (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_vehicles_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_vehicles_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    UNIQUE KEY uk_group_vehicle (group_id, vehicle_id),
    INDEX idx_group_vehicles_group (group_id),
    INDEX idx_group_vehicles_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing group vehicle associations
INSERT IGNORE INTO group_vehicles (id, group_id, vehicle_id, status)
SELECT '55555555-5555-5555-5555-555555555501', id, vehicle_id, 'ACTIVE'
FROM co_ownership_groups
WHERE vehicle_id IS NOT NULL;

-- 3. Enhance group_members table
ALTER TABLE group_members ADD COLUMN member_role VARCHAR(30) NOT NULL DEFAULT 'MEMBER' AFTER status;
ALTER TABLE group_members ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE group_members ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. Refactor ownership_shares table to be vehicle-specific within a group
ALTER TABLE ownership_shares ADD COLUMN vehicle_id CHAR(36) NULL AFTER group_id;

-- Backfill vehicle_id for existing shares from co_ownership_groups
UPDATE ownership_shares os
JOIN co_ownership_groups cg ON os.group_id = cg.id
SET os.vehicle_id = cg.vehicle_id
WHERE os.vehicle_id IS NULL;

ALTER TABLE ownership_shares MODIFY COLUMN vehicle_id CHAR(36) NOT NULL;
ALTER TABLE ownership_shares ADD CONSTRAINT fk_ownership_shares_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE;

-- Drop single member_id unique constraint to allow member to have shares across different vehicles in the group
ALTER TABLE ownership_shares DROP INDEX member_id;
ALTER TABLE ownership_shares ADD CONSTRAINT uk_share_group_vehicle_member UNIQUE (group_id, vehicle_id, member_id);
ALTER TABLE ownership_shares ADD INDEX idx_shares_group_vehicle (group_id, vehicle_id);
