-- EVShare 3D - Phase 21: Co-Ownership Voting System (Hệ thống biểu quyết đồng sở hữu)

-- 1. Extend co_ownership_groups with voting policy configuration
ALTER TABLE co_ownership_groups
    ADD COLUMN voting_rule VARCHAR(40) NOT NULL DEFAULT 'OWNERSHIP_WEIGHTED',
    ADD COLUMN quorum_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    ADD COLUMN approval_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00;

-- 2. Create vote_proposals table
CREATE TABLE IF NOT EXISTS vote_proposals (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    created_by_user_id CHAR(36) NOT NULL,
    proposal_type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    estimated_amount DECIMAL(14, 2) NOT NULL,
    approved_budget DECIMAL(14, 2) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    decision_rule VARCHAR(40) NOT NULL DEFAULT 'OWNERSHIP_WEIGHTED',
    required_quorum_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    required_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    agreement_version VARCHAR(50) NOT NULL DEFAULT 'V1.0',
    voting_starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voting_ends_at TIMESTAMP NOT NULL,
    finalized_at TIMESTAMP NULL,
    execution_status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    execution_started_at TIMESTAMP NULL,
    execution_completed_at TIMESTAMP NULL,
    executed_by_staff_id CHAR(36) NULL,
    actual_cost DECIMAL(14, 2) NULL,
    related_maintenance_request_id CHAR(36) NULL,
    related_expense_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_proposals_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_proposals_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_proposals_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_proposals_staff FOREIGN KEY (executed_by_staff_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_proposals_group (group_id),
    INDEX idx_proposals_vehicle (vehicle_id),
    INDEX idx_proposals_status (status),
    INDEX idx_proposals_execution (execution_status),
    INDEX idx_proposals_type (proposal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create proposal_vote_eligibility table (Snapshots eligible voter identities and voting weights at voting open)
CREATE TABLE IF NOT EXISTS proposal_vote_eligibility (
    id CHAR(36) PRIMARY KEY,
    proposal_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL,
    voting_weight DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pve_proposal FOREIGN KEY (proposal_id) REFERENCES vote_proposals (id) ON DELETE CASCADE,
    CONSTRAINT fk_pve_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pve_member FOREIGN KEY (member_id) REFERENCES group_members (id) ON DELETE CASCADE,
    CONSTRAINT uk_proposal_eligible_user UNIQUE (proposal_id, user_id),
    INDEX idx_pve_proposal (proposal_id),
    INDEX idx_pve_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create proposal_votes table (Auditable record of member cast votes)
CREATE TABLE IF NOT EXISTS proposal_votes (
    id CHAR(36) PRIMARY KEY,
    proposal_id CHAR(36) NOT NULL,
    voter_user_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL,
    choice VARCHAR(20) NOT NULL,
    voting_weight_snapshot DECIMAL(5, 2) NOT NULL,
    comment VARCHAR(1000) NULL,
    cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pv_proposal FOREIGN KEY (proposal_id) REFERENCES vote_proposals (id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_user FOREIGN KEY (voter_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_member FOREIGN KEY (member_id) REFERENCES group_members (id) ON DELETE CASCADE,
    CONSTRAINT uk_proposal_user_vote UNIQUE (proposal_id, voter_user_id),
    INDEX idx_pv_proposal (proposal_id),
    INDEX idx_pv_user (voter_user_id),
    INDEX idx_pv_choice (choice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Extend expenses and maintenance_requests with proposal relationship
ALTER TABLE expenses
    ADD COLUMN related_proposal_id CHAR(36) NULL,
    ADD CONSTRAINT fk_expenses_proposal FOREIGN KEY (related_proposal_id) REFERENCES vote_proposals (id) ON DELETE SET NULL,
    ADD INDEX idx_expenses_proposal (related_proposal_id);

ALTER TABLE maintenance_requests
    ADD COLUMN related_proposal_id CHAR(36) NULL,
    ADD CONSTRAINT fk_maintenance_proposal FOREIGN KEY (related_proposal_id) REFERENCES vote_proposals (id) ON DELETE SET NULL,
    ADD INDEX idx_maintenance_proposal (related_proposal_id);

-- 6. Add foreign key relationships from vote_proposals to maintenance_requests and expenses
ALTER TABLE vote_proposals
    ADD CONSTRAINT fk_proposals_maintenance FOREIGN KEY (related_maintenance_request_id) REFERENCES maintenance_requests (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_proposals_expense FOREIGN KEY (related_expense_id) REFERENCES expenses (id) ON DELETE SET NULL,
    ADD INDEX idx_proposals_maintenance (related_maintenance_request_id),
    ADD INDEX idx_proposals_expense (related_expense_id);

-- 7. Seed Demo Proposals for EV01 and EV02
-- Proposal 1: EV01 - Thay 4 lốp Michelin e.Primacy (Bảo dưỡng, OPEN, 4.000.000 VND)
INSERT IGNORE INTO vote_proposals (
    id, group_id, vehicle_id, created_by_user_id,
    proposal_type, title, description,
    estimated_amount, approved_budget, currency,
    status, decision_rule, required_quorum_percentage, required_threshold_percentage, agreement_version,
    voting_starts_at, voting_ends_at, finalized_at, execution_status
) VALUES (
    '88888888-8888-8888-8888-888888888801',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    'MAINTENANCE',
    'Thay 4 lốp xe Michelin e.Primacy cho EV01',
    'Lốp hiện tại đã lăn bánh hơn 35.000 km, gai lốp mòn gần vạch chỉ thị an toàn. Cần thay thế bộ lốp chuyên dụng xe điện để đảm bảo an toàn vận hành và hiệu suất phanh.',
    4000000.00,
    4000000.00,
    'VND',
    'OPEN',
    'OWNERSHIP_WEIGHTED',
    50.00,
    50.00,
    'V1.0',
    CURRENT_TIMESTAMP,
    DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY),
    NULL,
    'NOT_STARTED'
);

-- Seed Eligibility for Proposal 1 (EV01 Co-Owners: A=40%, B=30%, C=30%)
INSERT IGNORE INTO proposal_vote_eligibility (id, proposal_id, user_id, member_id, voting_weight)
VALUES
    ('88888888-1111-1111-1111-888888888801', '88888888-8888-8888-8888-888888888801', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '33333333-3333-3333-3333-333333333301', 40.00),
    ('88888888-1111-1111-1111-888888888802', '88888888-8888-8888-8888-888888888801', '00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333302', 30.00),
    ('88888888-1111-1111-1111-888888888803', '88888888-8888-8888-8888-888888888801', '00000000-0000-0000-0000-000000000013', '33333333-3333-3333-3333-333333333303', 30.00);

-- Seed Creator vote for Proposal 1 (Nguyen Van A voted APPROVE 40%)
INSERT IGNORE INTO proposal_votes (id, proposal_id, voter_user_id, member_id, choice, voting_weight_snapshot, comment)
VALUES (
    '99999999-9999-9999-9999-999999999901',
    '88888888-8888-8888-8888-888888888801',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    '33333333-3333-3333-3333-333333333301',
    'APPROVE',
    40.00,
    'Đồng ý thay sớm trước chuyến đi dài ngày để an toàn.'
);

-- Proposal 2: EV01 - Lắp camera hành trình 4K & cảm biến áp suất lốp (Mua phụ kiện, APPROVED, 2.500.000 VND)
INSERT IGNORE INTO vote_proposals (
    id, group_id, vehicle_id, created_by_user_id,
    proposal_type, title, description,
    estimated_amount, approved_budget, currency,
    status, decision_rule, required_quorum_percentage, required_threshold_percentage, agreement_version,
    voting_starts_at, voting_ends_at, finalized_at, execution_status
) VALUES (
    '88888888-8888-8888-8888-888888888802',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000012',
    'ACCESSORY',
    'Lắp camera hành trình 4K và bộ cảm biến áp suất lốp TPMS',
    'Trang bị camera ghi hình trước sau tích hợp GPS và cảm biến đo áp suất lốp trực tiếp qua màn hình trung tâm, giúp bảo vệ quyền lợi nhóm khi xảy ra sự cố giao thông.',
    2500000.00,
    2500000.00,
    'VND',
    'APPROVED',
    'OWNERSHIP_WEIGHTED',
    50.00,
    50.00,
    'V1.0',
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY),
    'NOT_STARTED'
);

INSERT IGNORE INTO proposal_vote_eligibility (id, proposal_id, user_id, member_id, voting_weight)
VALUES
    ('88888888-2222-2222-2222-888888888801', '88888888-8888-8888-8888-888888888802', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '33333333-3333-3333-3333-333333333301', 40.00),
    ('88888888-2222-2222-2222-888888888802', '88888888-8888-8888-8888-888888888802', '00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333302', 30.00),
    ('88888888-2222-2222-2222-888888888803', '88888888-8888-8888-8888-888888888802', '00000000-0000-0000-0000-000000000013', '33333333-3333-3333-3333-333333333303', 30.00);

-- Votes for Proposal 2: Owner A (40%) APPROVE + Owner B (30%) APPROVE = 70% >= 50%
INSERT IGNORE INTO proposal_votes (id, proposal_id, voter_user_id, member_id, choice, voting_weight_snapshot, comment)
VALUES
    ('99999999-9999-9999-9999-999999999902', '88888888-8888-8888-8888-888888888802', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '33333333-3333-3333-3333-333333333301', 'APPROVE', 40.00, 'Rất hữu ích cho cả nhóm.'),
    ('99999999-9999-9999-9999-999999999903', '88888888-8888-8888-8888-888888888802', '00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333302', 'APPROVE', 30.00, 'Tôi đề xuất và hoàn toàn ủng hộ.');

-- Proposal 3: EV01 - Phủ Ceramic toàn thân xe (Nâng cấp xe, REJECTED, 6.000.000 VND)
INSERT IGNORE INTO vote_proposals (
    id, group_id, vehicle_id, created_by_user_id,
    proposal_type, title, description,
    estimated_amount, approved_budget, currency,
    status, decision_rule, required_quorum_percentage, required_threshold_percentage, agreement_version,
    voting_starts_at, voting_ends_at, finalized_at, execution_status
) VALUES (
    '88888888-8888-8888-8888-888888888803',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000013',
    'UPGRADE',
    'Phủ Ceramic bảo vệ sơn bóng cao cấp toàn thân xe',
    'Nâng cấp lớp phủ gốm Ceramic 3 lớp giúp chống trầy xước nhẹ và giữ độ bóng sơn lâu năm.',
    6000000.00,
    NULL,
    'VND',
    'REJECTED',
    'OWNERSHIP_WEIGHTED',
    50.00,
    50.00,
    'V1.0',
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 DAY),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY),
    DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY),
    'NOT_STARTED'
);

INSERT IGNORE INTO proposal_vote_eligibility (id, proposal_id, user_id, member_id, voting_weight)
VALUES
    ('88888888-3333-3333-3333-888888888801', '88888888-8888-8888-8888-888888888803', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '33333333-3333-3333-3333-333333333301', 40.00),
    ('88888888-3333-3333-3333-888888888802', '88888888-8888-8888-8888-888888888803', '00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333302', 30.00),
    ('88888888-3333-3333-3333-888888888803', '88888888-8888-8888-8888-888888888803', '00000000-0000-0000-0000-000000000013', '33333333-3333-3333-3333-333333333303', 30.00);

-- Votes for Proposal 3: Owner A (40%) REJECT + Owner B (30%) REJECT = 70% REJECT
INSERT IGNORE INTO proposal_votes (id, proposal_id, voter_user_id, member_id, choice, voting_weight_snapshot, comment)
VALUES
    ('99999999-9999-9999-9999-999999999904', '88888888-8888-8888-8888-888888888803', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', '33333333-3333-3333-3333-333333333301', 'REJECT', 40.00, 'Chi phí quá cao và không thực sự cấp thiết vào lúc này.'),
    ('99999999-9999-9999-9999-999999999905', '88888888-8888-8888-8888-888888888803', '00000000-0000-0000-0000-000000000012', '33333333-3333-3333-3333-333333333302', 'REJECT', 30.00, 'Tôi đồng ý với anh A, nên ưu tiên các khoản bảo dưỡng máy móc hơn.');

-- Proposal 4: EV02 - Bảo dưỡng định kỳ 20.000 km EV02 (Bảo dưỡng, OPEN, 3.200.000 VND)
INSERT IGNORE INTO vote_proposals (
    id, group_id, vehicle_id, created_by_user_id,
    proposal_type, title, description,
    estimated_amount, approved_budget, currency,
    status, decision_rule, required_quorum_percentage, required_threshold_percentage, agreement_version,
    voting_starts_at, voting_ends_at, finalized_at, execution_status
) VALUES (
    '88888888-8888-8888-8888-888888888804',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    '00000000-0000-0000-0000-000000000014',
    'MAINTENANCE',
    'Bảo dưỡng định kỳ mốc 20.000 km cho xe EV02',
    'Bảo dưỡng tiêu chuẩn nhà sản xuất: kiểm tra dung dịch làm mát pin, tra dầu phanh, căn chỉnh độ chụm bánh xe và cập nhật phần mềm BMS.',
    3200000.00,
    3200000.00,
    'VND',
    'OPEN',
    'OWNERSHIP_WEIGHTED',
    50.00,
    50.00,
    'V1.0',
    CURRENT_TIMESTAMP,
    DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY),
    NULL,
    'NOT_STARTED'
);

INSERT IGNORE INTO proposal_vote_eligibility (id, proposal_id, user_id, member_id, voting_weight)
VALUES
    ('88888888-4444-4444-4444-888888888801', '88888888-8888-8888-8888-888888888804', '00000000-0000-0000-0000-000000000014', '33333333-3333-3333-3333-333333333401', 50.00),
    ('88888888-4444-4444-4444-888888888802', '88888888-8888-8888-8888-888888888804', '00000000-0000-0000-0000-000000000015', '33333333-3333-3333-3333-333333333402', 30.00),
    ('88888888-4444-4444-4444-888888888803', '88888888-8888-8888-8888-888888888804', '00000000-0000-0000-0000-000000000016', '33333333-3333-3333-3333-333333333403', 20.00);

INSERT IGNORE INTO proposal_votes (id, proposal_id, voter_user_id, member_id, choice, voting_weight_snapshot, comment)
VALUES (
    '99999999-9999-9999-9999-999999999906',
    '88888888-8888-8888-8888-888888888804',
    '00000000-0000-0000-0000-000000000014',
    '33333333-3333-3333-3333-333333333401',
    'APPROVE',
    50.00,
    'Bảo dưỡng định kỳ theo khuyến cáo chính hãng.'
);
