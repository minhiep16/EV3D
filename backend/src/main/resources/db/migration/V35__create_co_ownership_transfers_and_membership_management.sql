-- EVShare 3D - Phase 23: Co-Ownership Membership & Ownership Transfer Management (Quản lý thành viên và chuyển nhượng quyền sở hữu)

-- 1. Create ownership_transfer_requests table
CREATE TABLE IF NOT EXISTS ownership_transfer_requests (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    from_user_id CHAR(36) NOT NULL,
    to_user_id CHAR(36) NOT NULL,
    transfer_percentage DECIMAL(5, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    reason TEXT NULL,
    rejection_reason TEXT NULL,
    contract_version_id CHAR(36) NULL,
    related_proposal_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    effective_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_otr_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_otr_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_otr_from_user FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_otr_to_user FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_otr_contract_version FOREIGN KEY (contract_version_id) REFERENCES co_ownership_contract_versions (id) ON DELETE SET NULL,
    INDEX idx_otr_group (group_id),
    INDEX idx_otr_vehicle (vehicle_id),
    INDEX idx_otr_from_user (from_user_id),
    INDEX idx_otr_to_user (to_user_id),
    INDEX idx_otr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create ownership_change_history table (Audit trail for immutable historical records)
CREATE TABLE IF NOT EXISTS ownership_change_history (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    transfer_request_id CHAR(36) NULL,
    from_user_id CHAR(36) NULL,
    to_user_id CHAR(36) NOT NULL,
    transferred_percentage DECIMAL(5, 2) NOT NULL,
    previous_ownership_snapshot TEXT NOT NULL,
    new_ownership_snapshot TEXT NOT NULL,
    reason VARCHAR(255) NULL,
    effective_at TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id CHAR(36) NOT NULL,
    CONSTRAINT fk_och_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_och_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_och_transfer_request FOREIGN KEY (transfer_request_id) REFERENCES ownership_transfer_requests (id) ON DELETE SET NULL,
    CONSTRAINT fk_och_from_user FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_och_to_user FOREIGN KEY (to_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_och_recorded_by FOREIGN KEY (recorded_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_och_group (group_id),
    INDEX idx_och_vehicle (vehicle_id),
    INDEX idx_och_effective (effective_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create membership_withdrawal_requests table
CREATE TABLE IF NOT EXISTS membership_withdrawal_requests (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    reason TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by_user_id CHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mwr_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_mwr_member FOREIGN KEY (member_id) REFERENCES group_members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mwr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mwr_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_mwr_group (group_id),
    INDEX idx_mwr_member (member_id),
    INDEX idx_mwr_user (user_id),
    INDEX idx_mwr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create membership_invitations table (Controlled invitation for new co-owners)
CREATE TABLE IF NOT EXISTS membership_invitations (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    invited_by_user_id CHAR(36) NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_user_id CHAR(36) NULL,
    proposed_percentage DECIMAL(5, 2) NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'INVITED',
    invitation_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_minv_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_minv_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_minv_invited_by FOREIGN KEY (invited_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_minv_invitee FOREIGN KEY (invitee_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_minv_group (group_id),
    INDEX idx_minv_email (invitee_email),
    INDEX idx_minv_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
