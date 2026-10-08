-- EVShare 3D - Phase 20: Expense Transparency & Verification Schema Migration
-- Enforces that manual expenses must be independently verified before affecting finance/cost sharing.

-- 1. Extend expenses table with verification status, evidence, and audit timestamps
ALTER TABLE expenses
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION' AFTER source_reference_id,
    ADD COLUMN evidence_url VARCHAR(500) NULL AFTER status,
    ADD COLUMN evidence_note VARCHAR(500) NULL AFTER evidence_url,
    ADD COLUMN approved_at TIMESTAMP NULL AFTER evidence_note,
    ADD COLUMN rejected_at TIMESTAMP NULL AFTER approved_at,
    ADD INDEX idx_expenses_status (status);

-- 2. Backfill existing Phase 18/19 legitimate historical seed expenses as APPROVED
-- Ensures existing demo and historical test data remains completely functional
UPDATE expenses
SET status = 'APPROVED',
    approved_at = occurred_at
WHERE status = 'PENDING_VERIFICATION';

-- 3. Create persistent expense_approvals entity table
-- Records independent co-owner verification decisions with ownership percentage snapshots
CREATE TABLE IF NOT EXISTS expense_approvals (
    id CHAR(36) PRIMARY KEY,
    expense_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    decision VARCHAR(20) NOT NULL,
    ownership_percentage_snapshot DECIMAL(7, 4) NOT NULL,
    comment VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_approvals_expense FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_approvals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_expense_approvals_expense_user UNIQUE (expense_id, user_id),
    INDEX idx_expense_approvals_expense (expense_id),
    INDEX idx_expense_approvals_user (user_id),
    INDEX idx_expense_approvals_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
