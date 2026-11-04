-- EVShare 3D - Phase 25 Onboarding, Vehicle Registration Drafts, Discovery and Join Requests

-- 1. Vehicle Registration Drafts Table
CREATE TABLE IF NOT EXISTS vehicle_registration_drafts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    vehicle_name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    model_year INT,
    license_plate VARCHAR(30),
    vin VARCHAR(50),
    battery_capacity DECIMAL(5,2),
    battery_type VARCHAR(50),
    group_name VARCHAR(100),
    voting_rule VARCHAR(40) DEFAULT 'OWNERSHIP_WEIGHTED',
    quorum_percentage DECIMAL(5,2) DEFAULT 50.00,
    approval_threshold_percentage DECIMAL(5,2) DEFAULT 50.00,
    proposed_co_owners TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vrd_user (user_id),
    INDEX idx_vrd_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Group Discovery Settings Table
CREATE TABLE IF NOT EXISTS group_discovery_settings (
    group_id CHAR(36) PRIMARY KEY,
    is_discoverable BOOLEAN DEFAULT FALSE,
    open_slots INT DEFAULT 0,
    target_model VARCHAR(100),
    public_terms TEXT,
    join_conditions TEXT,
    status VARCHAR(30) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gds_discoverable (is_discoverable),
    INDEX idx_gds_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Group Join Requests Table
CREATE TABLE IF NOT EXISTS group_join_requests (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    requested_percentage DECIMAL(5,2),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    review_notes TEXT,
    reviewed_by CHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gjr_group (group_id),
    INDEX idx_gjr_user (user_id),
    INDEX idx_gjr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Group Member Invitations Table
CREATE TABLE IF NOT EXISTS group_invitations (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    inviter_id CHAR(36) NOT NULL,
    invitee_email VARCHAR(150) NOT NULL,
    invitee_user_id CHAR(36) NULL,
    proposed_percentage DECIMAL(5,2) NOT NULL,
    invite_code VARCHAR(50) UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gi_group (group_id),
    INDEX idx_gi_invitee_email (invitee_email),
    INDEX idx_gi_invitee_user (invitee_user_id),
    INDEX idx_gi_code (invite_code),
    INDEX idx_gi_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

