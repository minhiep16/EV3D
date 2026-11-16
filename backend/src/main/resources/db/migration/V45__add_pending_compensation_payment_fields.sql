-- EVShare 3D - Phase 5.9: Compensation Payment Execution & Evidence Verification
-- Flyway Migration V45

ALTER TABLE dispute_compensations
    ADD COLUMN pending_payment_amount DECIMAL(14, 2) NULL AFTER decision_basis,
    ADD COLUMN pending_payment_reference VARCHAR(100) NULL AFTER pending_payment_amount,
    ADD COLUMN pending_receipt_url VARCHAR(500) NULL AFTER pending_payment_reference,
    ADD COLUMN pending_payment_date TIMESTAMP NULL AFTER pending_receipt_url,
    ADD COLUMN pending_payment_note TEXT NULL AFTER pending_payment_date,
    ADD COLUMN pending_submitted_at TIMESTAMP NULL AFTER pending_payment_note,
    ADD COLUMN rejection_reason TEXT NULL AFTER pending_submitted_at;
