-- EVShare 3D - Phase 20: Add DEMO Financial Mode Separation and Isolation
-- Ensures all demo financial transactions and funds are strictly isolated from real banking settlements

ALTER TABLE shared_funds 
    ADD COLUMN financial_mode VARCHAR(20) NOT NULL DEFAULT 'DEMO';

ALTER TABLE fund_contributions 
    ADD COLUMN financial_mode VARCHAR(20) NOT NULL DEFAULT 'DEMO';

ALTER TABLE fund_transactions 
    ADD COLUMN financial_mode VARCHAR(20) NOT NULL DEFAULT 'DEMO';

ALTER TABLE personal_expense_payments 
    ADD COLUMN financial_mode VARCHAR(20) NOT NULL DEFAULT 'DEMO';

-- Add indexes for strict financial mode querying and ledger isolation
CREATE INDEX idx_shared_funds_mode ON shared_funds (financial_mode);
CREATE INDEX idx_fund_contrib_mode ON fund_contributions (financial_mode);
CREATE INDEX idx_fund_tx_mode ON fund_transactions (financial_mode);
CREATE INDEX idx_personal_pay_mode ON personal_expense_payments (financial_mode);

-- Explicitly verify existing seeded records are marked as DEMO mode
UPDATE shared_funds SET financial_mode = 'DEMO' WHERE financial_mode IS NULL OR financial_mode = '';
UPDATE fund_contributions SET financial_mode = 'DEMO' WHERE financial_mode IS NULL OR financial_mode = '';
UPDATE fund_transactions SET financial_mode = 'DEMO' WHERE financial_mode IS NULL OR financial_mode = '';
UPDATE personal_expense_payments SET financial_mode = 'DEMO' WHERE financial_mode IS NULL OR financial_mode = '';
