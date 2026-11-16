-- EVShare 3D - Phase 5.8: Dispute Mediation, Compensation Decisions and Verified Compensation Execution
-- Flyway Migration V44

-- 1. Extend disputes table with incident investigation, distinct monetary tracking and proposal parameters
ALTER TABLE disputes
    ADD COLUMN investigation_conclusion VARCHAR(50) NULL AFTER description,
    ADD COLUMN investigation_notes TEXT NULL AFTER investigation_conclusion,
    ADD COLUMN investigated_by_user_id CHAR(36) NULL AFTER investigation_notes,
    ADD COLUMN investigated_at TIMESTAMP NULL AFTER investigated_by_user_id,
    ADD COLUMN resolution_type VARCHAR(50) NULL AFTER disputed_amount,
    ADD COLUMN proposed_amount DECIMAL(14, 2) NULL AFTER resolution_type,
    ADD COLUMN approved_amount DECIMAL(14, 2) NULL AFTER proposed_amount,
    ADD COLUMN verified_paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00 AFTER approved_amount,
    ADD COLUMN outstanding_amount DECIMAL(14, 2) NULL AFTER verified_paid_amount,
    ADD COLUMN proposed_payer_type VARCHAR(40) NULL AFTER outstanding_amount,
    ADD COLUMN proposed_payer_user_id CHAR(36) NULL AFTER proposed_payer_type,
    ADD COLUMN proposed_payer_name VARCHAR(255) NULL AFTER proposed_payer_user_id,
    ADD COLUMN proposed_recipient_user_id CHAR(36) NULL AFTER proposed_payer_name,
    ADD COLUMN proposed_recipient_name VARCHAR(255) NULL AFTER proposed_recipient_user_id,
    ADD COLUMN decision_basis TEXT NULL AFTER proposed_recipient_name,
    ADD COLUMN resolution_deadline TIMESTAMP NULL AFTER decision_basis;

ALTER TABLE disputes
    ADD CONSTRAINT fk_disputes_investigator FOREIGN KEY (investigated_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_disputes_proposed_payer FOREIGN KEY (proposed_payer_user_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_disputes_proposed_recipient FOREIGN KEY (proposed_recipient_user_id) REFERENCES users (id) ON DELETE SET NULL;

-- 2. Create dispute_compensations table (Auditable Compensation Obligation)
CREATE TABLE IF NOT EXISTS dispute_compensations (
    id CHAR(36) PRIMARY KEY,
    dispute_id CHAR(36) NOT NULL,
    payer_user_id CHAR(36) NULL,
    payer_type VARCHAR(40) NOT NULL DEFAULT 'PREVIOUS_CO_OWNER',
    payer_name VARCHAR(255) NOT NULL,
    recipient_user_id CHAR(36) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    approved_amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    verified_paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount DECIMAL(14, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_PAYMENT',
    authorized_by_user_id CHAR(36) NOT NULL,
    authorized_at TIMESTAMP NOT NULL,
    payment_reference VARCHAR(100) NULL,
    decision_basis TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_comp_dispute FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_comp_payer FOREIGN KEY (payer_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_dispute_comp_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_comp_authorizer FOREIGN KEY (authorized_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_dispute_comp_dispute (dispute_id),
    INDEX idx_dispute_comp_payer (payer_user_id),
    INDEX idx_dispute_comp_recipient (recipient_user_id),
    INDEX idx_dispute_comp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create dispute_compensation_payments table (Partial & Full Payment Verification Records)
CREATE TABLE IF NOT EXISTS dispute_compensation_payments (
    id CHAR(36) PRIMARY KEY,
    compensation_id CHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    payment_reference VARCHAR(100) NOT NULL,
    receipt_url VARCHAR(500) NULL,
    payment_date TIMESTAMP NOT NULL,
    verified_by_user_id CHAR(36) NOT NULL,
    verified_by_name VARCHAR(100) NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_pay_comp FOREIGN KEY (compensation_id) REFERENCES dispute_compensations (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_pay_verifier FOREIGN KEY (verified_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_dispute_pay_comp (compensation_id),
    INDEX idx_dispute_pay_ref (payment_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create dispute_action_logs table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS dispute_action_logs (
    id CHAR(36) PRIMARY KEY,
    dispute_id CHAR(36) NOT NULL,
    actor_id CHAR(36) NOT NULL,
    actor_name VARCHAR(100) NULL,
    actor_role VARCHAR(50) NULL,
    action_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NULL,
    reason VARCHAR(500) NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_act_dispute FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_act_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_dispute_act_dispute (dispute_id),
    INDEX idx_dispute_act_actor (actor_id),
    INDEX idx_dispute_act_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
