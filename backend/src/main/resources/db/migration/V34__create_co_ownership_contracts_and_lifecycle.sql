-- EVShare 3D - Phase 22: Digital Co-Ownership Contract Management (Quản lý hợp đồng đồng sở hữu điện tử)

-- 1. Create co_ownership_contracts table
CREATE TABLE IF NOT EXISTS co_ownership_contracts (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    contract_code VARCHAR(50) NOT NULL UNIQUE,
    current_version_id CHAR(36) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contracts_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_contracts_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_contracts_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_group_vehicle_contract UNIQUE (group_id, vehicle_id),
    INDEX idx_contracts_group (group_id),
    INDEX idx_contracts_vehicle (vehicle_id),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_code (contract_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create co_ownership_contract_versions table
CREATE TABLE IF NOT EXISTS co_ownership_contract_versions (
    id CHAR(36) PRIMARY KEY,
    contract_id CHAR(36) NOT NULL,
    version_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_snapshot LONGTEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    ownership_snapshot TEXT NOT NULL,
    voting_rule_snapshot TEXT NOT NULL,
    financial_rule_snapshot TEXT NOT NULL,
    effective_from TIMESTAMP NULL,
    effective_until TIMESTAMP NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by_user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP NULL,
    CONSTRAINT fk_cversions_contract FOREIGN KEY (contract_id) REFERENCES co_ownership_contracts (id) ON DELETE CASCADE,
    CONSTRAINT fk_cversions_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_contract_version_number UNIQUE (contract_id, version_number),
    INDEX idx_cversions_contract (contract_id),
    INDEX idx_cversions_status (status),
    INDEX idx_cversions_number (version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add foreign key for current_version_id in co_ownership_contracts
ALTER TABLE co_ownership_contracts
    ADD CONSTRAINT fk_contracts_current_version FOREIGN KEY (current_version_id) REFERENCES co_ownership_contract_versions (id) ON DELETE SET NULL;

-- 4. Create contract_acceptances table
CREATE TABLE IF NOT EXISTS contract_acceptances (
    id CHAR(36) PRIMARY KEY,
    contract_version_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED',
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content_hash_at_acceptance VARCHAR(64) NOT NULL,
    acceptance_method VARCHAR(50) NOT NULL DEFAULT 'DEMO_ELECTRONIC_ACCEPTANCE',
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_acceptances_version FOREIGN KEY (contract_version_id) REFERENCES co_ownership_contract_versions (id) ON DELETE CASCADE,
    CONSTRAINT fk_acceptances_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_version_user_acceptance UNIQUE (contract_version_id, user_id),
    INDEX idx_acceptances_version (contract_version_id),
    INDEX idx_acceptances_user (user_id),
    INDEX idx_acceptances_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed Canonical Initial Contract for EV01 (Group: 22222222-2222-2222-2222-222222222222, Vehicle: 11111111-1111-1111-1111-111111111111)
INSERT IGNORE INTO co_ownership_contracts (
    id, group_id, vehicle_id, contract_code, current_version_id, status, created_by_user_id, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'HD-EV01-2026',
    NULL,
    'ACTIVE',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Seed Version 1.0 for EV01 Contract
INSERT IGNORE INTO co_ownership_contract_versions (
    id, contract_id, version_number, title, content_snapshot, content_hash,
    ownership_snapshot, voting_rule_snapshot, financial_rule_snapshot,
    effective_from, effective_until, status, created_by_user_id, created_at, activated_at
) VALUES (
    '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555501',
    1,
    'Hợp đồng Đồng sở hữu Phương tiện Điện EV01 (Phiên bản V1.0)',
    'HỢP ĐỒNG ĐỒNG SỞ HỮU VÀ QUY CHẾ VẬN HÀNH PHƯƠNG TIỆN ĐIỆN EV01\n\nĐiều 1: Thông tin hợp đồng\nMã hợp đồng: HD-EV01-2026. Ngày hiệu lực: 01/01/2026. Nền tảng quản lý: EVShare 3D.\n\nĐiều 2: Thông tin phương tiện\nTên xe: VinFast VF8 (EV01). Biển số: 30K-123.45. Số khung VIN: VF8VN2026EV010001. Model 3D: /models/ev-car.glb.\n\nĐiều 3: Danh sách đồng sở hữu\n1. Nguyễn Văn A (Đại diện nhóm - 40%)\n2. Trần Thị B (Đồng sở hữu - 30%)\n3. Lê Văn C (Đồng sở hữu - 30%)\n\nĐiều 4: Tỷ lệ sở hữu và vốn góp\nTổng tỷ lệ sở hữu: 100.00%. Vốn góp tương ứng tỷ lệ đã đăng ký hợp pháp.\n\nĐiều 5: Quyền sử dụng phương tiện\nThời gian sử dụng phương tiện phân bổ theo tỷ lệ sở hữu thực tế hàng tháng.\n\nĐiều 6: Quy trình đặt lịch và bàn giao xe\nĐặt lịch trước qua hệ thống Garage 3D. Nhận xe và trả xe có nhân viên STAFF kiểm tra ngoại quan và ký biên bản bàn giao.\n\nĐiều 7: Trách nhiệm khi sử dụng phương tiện\nNgười vận hành chịu trách nhiệm pháp lý khi lưu thông và giữ gìn tình trạng kỹ thuật của xe.\n\nĐiều 8: Nguyên tắc tính chi phí điện\nChi phí sạc điện chuyến đi tính 100% trách nhiệm cho cá nhân người sử dụng xe.\n\nĐiều 9: Nguyên tắc phân bổ chi phí chung\nBảo dưỡng, bảo hiểm, sửa chữa chung phân bổ theo tỷ lệ sở hữu và vốn góp.\n\nĐiều 10: Quy chế biểu quyết\nBiểu quyết theo tỷ lệ sở hữu (OWNERSHIP_WEIGHTED). Tỷ lệ tham gia tối thiểu (Quorum): 50.00%. Tỷ lệ thông qua (Approval Threshold): 50.00%.\n\nĐiều 11: Quỹ chung và giải ngân\nQuỹ chung duy trì để thanh toán các khoản bảo dưỡng và chi phí định kỳ. Giải ngân theo đề xuất đã biểu quyết.\n\nĐiều 12: Bảo dưỡng, sửa chữa và nâng cấp\nThực hiện định kỳ tại Garage được phê duyệt, có sự xác nhận của nhân viên kỹ thuật STAFF.\n\nĐiều 13: Xử lý hư hỏng và tranh chấp\nHư hỏng phát sinh trong chuyến đi của ai do người đó chịu trách nhiệm theo biên bản kiểm tra 3D Damage Mapping.\n\nĐiều 14: Thay đổi thành viên và tỷ lệ sở hữu\nMọi chuyển nhượng cổ phần hoặc thay đổi thành viên phải được 100% đồng sở hữu chấp thuận và lập phụ lục mới.\n\nĐiều 15: Điều kiện sửa đổi, chấm dứt hợp đồng\nSửa đổi quy chế hợp đồng yêu cầu tạo phiên bản mới và phải được 100% thành viên xác nhận điện tử.\n\nĐiều 16: Xác nhận của các bên\nCác bên xác nhận nội dung điện tử trên hệ thống EVShare 3D.',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    '[{"userId":"cbd7b894-a6c6-4b51-81d0-9a344715755b","fullName":"Nguyen Van A","percentage":40.00,"role":"REPRESENTATIVE"},{"userId":"00000000-0000-0000-0000-000000000012","fullName":"Tran Thi B","percentage":30.00,"role":"MEMBER"},{"userId":"00000000-0000-0000-0000-000000000013","fullName":"Le Van C","percentage":30.00,"role":"MEMBER"}]',
    '{"decisionRule":"OWNERSHIP_WEIGHTED","quorumPercentage":50.00,"approvalThresholdPercentage":50.00}',
    '{"chargingPolicy":"USER_RESPONSIBILITY","maintenancePolicy":"USAGE_AND_CAPITAL","insurancePolicy":"OWNERSHIP_RATIO"}',
    CURRENT_TIMESTAMP,
    NULL,
    'ACTIVE',
    'cbd7b894-a6c6-4b51-81d0-9a344715755b',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Update current_version_id for EV01 contract
UPDATE co_ownership_contracts
SET current_version_id = '66666666-6666-6666-6666-666666666601'
WHERE id = '55555555-5555-5555-5555-555555555501';

-- Seed acceptances for Version 1.0 of EV01 Contract (All 3 co-owners)
INSERT IGNORE INTO contract_acceptances (
    id, contract_version_id, user_id, status, accepted_at, content_hash_at_acceptance, acceptance_method, created_at
) VALUES 
    ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', 'cbd7b894-a6c6-4b51-81d0-9a344715755b', 'ACCEPTED', CURRENT_TIMESTAMP, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'DEMO_ELECTRONIC_ACCEPTANCE', CURRENT_TIMESTAMP),
    ('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000012', 'ACCEPTED', CURRENT_TIMESTAMP, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'DEMO_ELECTRONIC_ACCEPTANCE', CURRENT_TIMESTAMP),
    ('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000013', 'ACCEPTED', CURRENT_TIMESTAMP, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'DEMO_ELECTRONIC_ACCEPTANCE', CURRENT_TIMESTAMP);
