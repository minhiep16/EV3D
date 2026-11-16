-- EVShare 3D - Phase 5.5: Dispute Management, Evidence Tracking, Mediation and Resolution Workflow
-- Flyway Migration V43

-- 1. Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id CHAR(36) PRIMARY KEY,
    reference_code VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id CHAR(36) NOT NULL,
    group_id CHAR(36) NULL,
    created_by_user_id CHAR(36) NOT NULL,
    assigned_staff_id CHAR(36) NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    booking_id CHAR(36) NULL,
    trip_id CHAR(36) NULL,
    handover_id CHAR(36) NULL,
    inspection_id CHAR(36) NULL,
    damage_record_id CHAR(36) NULL,
    expense_id CHAR(36) NULL,
    expense_share_id CHAR(36) NULL,
    personal_payment_id CHAR(36) NULL,
    proposal_id CHAR(36) NULL,
    ownership_transfer_id CHAR(36) NULL,
    disputed_amount DECIMAL(14, 2) NULL,
    evidence_snapshot_json LONGTEXT NULL,
    proposed_resolution TEXT NULL,
    proposed_resolution_by_user_id CHAR(36) NULL,
    proposed_resolution_at TIMESTAMP NULL,
    resolution_accepted_by_parties BOOLEAN NULL,
    resolution_summary TEXT NULL,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    corrective_action_executed BOOLEAN NOT NULL DEFAULT FALSE,
    corrective_action_summary TEXT NULL,
    corrective_action_executed_at TIMESTAMP NULL,
    reopen_count INT NOT NULL DEFAULT 0,
    reopen_reason TEXT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_disputes_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_disputes_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE SET NULL,
    CONSTRAINT fk_disputes_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_disputes_staff FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_disputes_proposer FOREIGN KEY (proposed_resolution_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_disputes_vehicle (vehicle_id),
    INDEX idx_disputes_group (group_id),
    INDEX idx_disputes_status (status),
    INDEX idx_disputes_category (category),
    INDEX idx_disputes_creator (created_by_user_id),
    INDEX idx_disputes_booking (booking_id),
    INDEX idx_disputes_trip (trip_id),
    INDEX idx_disputes_handover (handover_id),
    INDEX idx_disputes_inspection (inspection_id),
    INDEX idx_disputes_damage (damage_record_id),
    INDEX idx_disputes_expense (expense_id),
    INDEX idx_disputes_expense_share (expense_share_id),
    INDEX idx_disputes_personal_payment (personal_payment_id),
    INDEX idx_disputes_proposal (proposal_id),
    INDEX idx_disputes_transfer (ownership_transfer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create dispute_participants table
CREATE TABLE IF NOT EXISTS dispute_participants (
    id CHAR(36) PRIMARY KEY,
    dispute_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role VARCHAR(40) NOT NULL,
    has_accepted_resolution BOOLEAN NULL,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_parts_dispute FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_parts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_dispute_participant UNIQUE (dispute_id, user_id),
    INDEX idx_dispute_parts_user (user_id),
    INDEX idx_dispute_parts_dispute (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create dispute_evidence table
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id CHAR(36) PRIMARY KEY,
    dispute_id CHAR(36) NOT NULL,
    uploaded_by_user_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NULL,
    file_size_bytes BIGINT NULL,
    integrity_hash VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_evid_dispute FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_evid_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_dispute_evid_dispute (dispute_id),
    INDEX idx_dispute_evid_user (uploaded_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create dispute_messages table
CREATE TABLE IF NOT EXISTS dispute_messages (
    id CHAR(36) PRIMARY KEY,
    dispute_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    visibility VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_msgs_dispute FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_msgs_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_dispute_msgs_dispute (dispute_id),
    INDEX idx_dispute_msgs_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

