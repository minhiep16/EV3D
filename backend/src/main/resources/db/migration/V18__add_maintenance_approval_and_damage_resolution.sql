-- EVShare 3D - Phase 15 Extension: Co-Owner Maintenance Approval & Damage Resolution

-- 1. Extend maintenance_requests
ALTER TABLE maintenance_requests
    MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    ADD COLUMN approved_at TIMESTAMP NULL AFTER completed_at,
    ADD COLUMN approved_weight DECIMAL(5, 2) NULL AFTER approved_at;

-- 2. Extend damage_records
ALTER TABLE damage_records
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'OPEN' AFTER note,
    ADD COLUMN resolved_at TIMESTAMP NULL AFTER updated_at,
    ADD COLUMN resolved_by_maintenance_request_id CHAR(36) NULL AFTER resolved_at;

ALTER TABLE damage_records
    ADD CONSTRAINT fk_damages_resolved_maintenance FOREIGN KEY (resolved_by_maintenance_request_id)
        REFERENCES maintenance_requests (id) ON DELETE SET NULL,
    ADD INDEX idx_damages_status (status),
    ADD INDEX idx_damages_resolved_maint (resolved_by_maintenance_request_id);

-- 3. Create maintenance_approval_votes table
CREATE TABLE IF NOT EXISTS maintenance_approval_votes (
    id CHAR(36) PRIMARY KEY,
    maintenance_request_id CHAR(36) NOT NULL,
    group_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    voting_weight DECIMAL(5, 2) NOT NULL,
    comment VARCHAR(1000) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mav_maintenance FOREIGN KEY (maintenance_request_id) REFERENCES maintenance_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_mav_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_mav_member FOREIGN KEY (member_id) REFERENCES group_members (id) ON DELETE CASCADE,
    CONSTRAINT fk_mav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_maintenance_member_vote UNIQUE (maintenance_request_id, member_id),
    INDEX idx_mav_maintenance (maintenance_request_id),
    INDEX idx_mav_group (group_id),
    INDEX idx_mav_member (member_id),
    INDEX idx_mav_user (user_id),
    INDEX idx_mav_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
