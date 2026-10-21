-- EVShare 3D - Phase 20: Shared Fund Management & Financial Reconciliation Schema Migration
-- Implements SharedFund, FundContribution, FundTransaction, and PersonalExpensePayment

-- 1. Shared Funds Table
CREATE TABLE IF NOT EXISTS shared_funds (
    id CHAR(36) PRIMARY KEY,
    group_id CHAR(36) NOT NULL UNIQUE,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    available_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_shared_funds_group FOREIGN KEY (group_id) REFERENCES co_ownership_groups (id) ON DELETE CASCADE,
    INDEX idx_shared_funds_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Fund Contributions Table (Member Contribution Requests)
CREATE TABLE IF NOT EXISTS fund_contributions (
    id CHAR(36) PRIMARY KEY,
    fund_id CHAR(36) NOT NULL,
    contributor_user_id CHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_reference VARCHAR(100) NULL,
    evidence_url VARCHAR(500) NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by_user_id CHAR(36) NULL,
    CONSTRAINT fk_fund_contributions_fund FOREIGN KEY (fund_id) REFERENCES shared_funds (id) ON DELETE CASCADE,
    CONSTRAINT fk_fund_contributions_user FOREIGN KEY (contributor_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fund_contributions_verifier FOREIGN KEY (verified_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_fund_contrib_fund (fund_id),
    INDEX idx_fund_contrib_user (contributor_user_id),
    INDEX idx_fund_contrib_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Fund Transactions Table (Audited Ledger of Inflows and Outflows)
CREATE TABLE IF NOT EXISTS fund_transactions (
    id CHAR(36) PRIMARY KEY,
    fund_id CHAR(36) NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    reference_type VARCHAR(40) NOT NULL,
    reference_id VARCHAR(100) NULL,
    balance_after DECIMAL(14, 2) NULL,
    description VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    confirmed_by_user_id CHAR(36) NULL,
    CONSTRAINT fk_fund_transactions_fund FOREIGN KEY (fund_id) REFERENCES shared_funds (id) ON DELETE CASCADE,
    CONSTRAINT fk_fund_transactions_confirmer FOREIGN KEY (confirmed_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_fund_tx_fund (fund_id),
    INDEX idx_fund_tx_type (transaction_type),
    INDEX idx_fund_tx_ref (reference_type, reference_id),
    INDEX idx_fund_tx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Personal Expense Payments Table (Audited Settlement of User-Responsible Expenses)
CREATE TABLE IF NOT EXISTS personal_expense_payments (
    id CHAR(36) PRIMARY KEY,
    expense_id CHAR(36) NOT NULL,
    expense_share_id CHAR(36) NULL,
    payer_user_id CHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PAYMENT_SUBMITTED',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    payment_reference VARCHAR(100) NULL,
    evidence_url VARCHAR(500) NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    verified_by_user_id CHAR(36) NULL,
    CONSTRAINT fk_personal_payments_expense FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
    CONSTRAINT fk_personal_payments_share FOREIGN KEY (expense_share_id) REFERENCES expense_shares (id) ON DELETE SET NULL,
    CONSTRAINT fk_personal_payments_payer FOREIGN KEY (payer_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_personal_payments_verifier FOREIGN KEY (verified_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_personal_pay_expense (expense_id),
    INDEX idx_personal_pay_payer (payer_user_id),
    INDEX idx_personal_pay_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed Authoritative Shared Fund Records for EV01 Co-Ownership Group (Group ID: 22222222-2222-2222-2222-222222222222)
-- Reconciles the demo 25.000.000 VND balance through real verified member contributions and ledger transactions
INSERT IGNORE INTO shared_funds (
    id,
    group_id,
    currency,
    available_balance,
    version,
    created_at
) VALUES (
    '66666666-6666-6666-6666-666666660001',
    '22222222-2222-2222-2222-222222222222',
    'VND',
    25000000.00,
    0,
    '2026-09-01 08:00:00'
);

-- Seed Confirmed Member Contributions for EV01 Fund
-- Owner A: Nguyen Van A (40%) -> 10,000,000 VND
-- Owner B: Tran Thi B (30%) -> 7,500,000 VND
-- Owner C: Le Van C (30%) -> 7,500,000 VND
-- Total Inflow = 25,000,000 VND
INSERT IGNORE INTO fund_contributions (
    id,
    fund_id,
    contributor_user_id,
    amount,
    status,
    payment_method,
    payment_reference,
    note,
    created_at,
    verified_at,
    verified_by_user_id
) VALUES 
    (
        '66666666-6666-6666-6666-666666660011',
        '66666666-6666-6666-6666-666666660001',
        'cbd7b894-a6c6-4b51-81d0-9a344715755b',
        10000000.00,
        'CONFIRMED',
        'BANK_TRANSFER',
        'EV01-INIT-CONTRIB-A',
        'Đóng góp vốn quỹ ban đầu nhóm EV01 (40% vốn)',
        '2026-09-01 08:30:00',
        '2026-09-01 09:00:00',
        '00000000-0000-0000-0000-000000000021'
    ),
    (
        '66666666-6666-6666-6666-666666660012',
        '66666666-6666-6666-6666-666666660001',
        '00000000-0000-0000-0000-000000000012',
        7500000.00,
        'CONFIRMED',
        'BANK_TRANSFER',
        'EV01-INIT-CONTRIB-B',
        'Đóng góp vốn quỹ ban đầu nhóm EV01 (30% vốn)',
        '2026-09-01 08:45:00',
        '2026-09-01 09:05:00',
        '00000000-0000-0000-0000-000000000021'
    ),
    (
        '66666666-6666-6666-6666-666666660013',
        '66666666-6666-6666-6666-666666660001',
        '00000000-0000-0000-0000-000000000013',
        7500000.00,
        'CONFIRMED',
        'BANK_TRANSFER',
        'EV01-INIT-CONTRIB-C',
        'Đóng góp vốn quỹ ban đầu nhóm EV01 (30% vốn)',
        '2026-09-01 09:00:00',
        '2026-09-01 09:10:00',
        '00000000-0000-0000-0000-000000000021'
    );

-- Seed Confirmed Fund Transactions (Ledger Inflows for EV01 Fund)
INSERT IGNORE INTO fund_transactions (
    id,
    fund_id,
    transaction_type,
    amount,
    direction,
    status,
    reference_type,
    reference_id,
    balance_after,
    description,
    created_at,
    confirmed_at,
    confirmed_by_user_id
) VALUES 
    (
        '66666666-6666-6666-6666-666666660021',
        '66666666-6666-6666-6666-666666660001',
        'CONTRIBUTION',
        10000000.00,
        'INFLOW',
        'CONFIRMED',
        'CONTRIBUTION',
        '66666666-6666-6666-6666-666666660011',
        10000000.00,
        'Đóng góp quỹ ban đầu thành viên Nguyen Van A (40% vốn)',
        '2026-09-01 08:30:00',
        '2026-09-01 09:00:00',
        '00000000-0000-0000-0000-000000000021'
    ),
    (
        '66666666-6666-6666-6666-666666660022',
        '66666666-6666-6666-6666-666666660001',
        'CONTRIBUTION',
        7500000.00,
        'INFLOW',
        'CONFIRMED',
        'CONTRIBUTION',
        '66666666-6666-6666-6666-666666660012',
        17500000.00,
        'Đóng góp quỹ ban đầu thành viên Tran Thi B (30% vốn)',
        '2026-09-01 08:45:00',
        '2026-09-01 09:05:00',
        '00000000-0000-0000-0000-000000000021'
    ),
    (
        '66666666-6666-6666-6666-666666660023',
        '66666666-6666-6666-6666-666666660001',
        'CONTRIBUTION',
        7500000.00,
        'INFLOW',
        'CONFIRMED',
        'CONTRIBUTION',
        '66666666-6666-6666-6666-666666660013',
        25000000.00,
        'Đóng góp quỹ ban đầu thành viên Le Van C (30% vốn)',
        '2026-09-01 09:00:00',
        '2026-09-01 09:10:00',
        '00000000-0000-0000-0000-000000000021'
    );

-- 6. Seed Authoritative Shared Fund Record for EV02 Co-Ownership Group (Group ID: 22222222-2222-2222-2222-222222222202)
INSERT IGNORE INTO shared_funds (
    id,
    group_id,
    currency,
    available_balance,
    version,
    created_at
) VALUES (
    '66666666-6666-6666-6666-666666660002',
    '22222222-2222-2222-2222-222222222202',
    'VND',
    15000000.00,
    0,
    '2026-09-01 08:00:00'
);
