-- EVShare 3D - Phase 07 Co-Ownership Schema and Demo Seed Migration

-- 1. Co-Ownership Groups
CREATE TABLE IF NOT EXISTS co_ownership_groups (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_co_ownership_groups_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    INDEX idx_co_groups_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Group Members
CREATE TABLE IF NOT EXISTS group_members (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE KEY uk_group_member (group_id, user_id),
    INDEX idx_group_members_group (group_id),
    INDEX idx_group_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ownership Shares
CREATE TABLE IF NOT EXISTS ownership_shares (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL UNIQUE,
    percentage DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ownership_shares_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_ownership_shares_member FOREIGN KEY (member_id) REFERENCES group_members (id) ON DELETE CASCADE,
    INDEX idx_shares_group (group_id),
    INDEX idx_shares_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed Demo Users for Co-Owners (Idempotent INSERT IGNORE)
-- Owner A: cbd7b894-a6c6-4b51-81d0-9a344715755b (Nguyen Van A)
-- Owner B: 00000000-0000-0000-0000-000000000012 (Tran Thi B)
-- Owner C: 00000000-0000-0000-0000-000000000013 (Le Van C)
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, status)
VALUES 
    ('cbd7b894-a6c6-4b51-81d0-9a344715755b', 'owner_a@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Nguyen Van A', 'CO_OWNER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000012', 'owner_b@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Tran Thi B', 'CO_OWNER', 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000013', 'owner_c@evshare.com', '$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW', 'Le Van C', 'CO_OWNER', 'ACTIVE');

-- 5. Seed Co-Ownership Group for EV01
INSERT IGNORE INTO co_ownership_groups (id, vehicle_id, name)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'EV01 Co-ownership Group'
);

-- 6. Seed Group Members for EV01 Co-Ownership Group
INSERT IGNORE INTO group_members (id, group_id, user_id, status)
VALUES 
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000012', 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000013', 'ACTIVE');

-- 7. Seed Ownership Shares (Owner A: 40%, Owner B: 30%, Owner C: 30%, Total: 100%)
INSERT IGNORE INTO ownership_shares (id, group_id, member_id, percentage)
VALUES 
    ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', 40.00),
    ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333302', 30.00),
    ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333303', 30.00);
