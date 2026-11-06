-- EVShare 3D - Phase 25 Vehicle Registration & Staff Approval Workflow
-- Adds valuation, governance settings, submission timestamp, and staff review audit columns to vehicle_registration_drafts

ALTER TABLE vehicle_registration_drafts
    ADD COLUMN vehicle_value DECIMAL(15, 2) DEFAULT 1200000000.00,
    ADD COLUMN registration_city VARCHAR(100) DEFAULT 'Hà Nội',
    ADD COLUMN model_3d_url VARCHAR(255) NULL,
    ADD COLUMN monthly_fund_contribution DECIMAL(15, 2) DEFAULT 2000000.00,
    ADD COLUMN late_payment_fee_rate DECIMAL(6, 4) DEFAULT 0.0500,
    ADD COLUMN maintenance_reserve_rate DECIMAL(6, 4) DEFAULT 0.1500,
    ADD COLUMN max_consecutive_booking_days INT DEFAULT 7,
    ADD COLUMN current_step INT DEFAULT 1,
    ADD COLUMN submitted_at TIMESTAMP NULL,
    ADD COLUMN reviewed_by CHAR(36) NULL,
    ADD COLUMN reviewed_at TIMESTAMP NULL,
    ADD COLUMN review_decision VARCHAR(30) NULL,
    ADD COLUMN review_reason VARCHAR(1000) NULL,
    ADD COLUMN created_vehicle_id CHAR(36) NULL,
    ADD COLUMN created_group_id CHAR(36) NULL;

