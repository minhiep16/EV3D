-- EVShare 3D - Phase 25 Electronic Consent & Contract Review for Group Invitations
-- Persists immutable consent audit evidence directly on group invitations

ALTER TABLE group_invitations
    ADD COLUMN contract_version_id CHAR(36) NULL,
    ADD COLUMN consent_content_hash VARCHAR(64) NULL,
    ADD COLUMN consented_at TIMESTAMP NULL,
    ADD COLUMN signer_full_name VARCHAR(100) NULL,
    ADD COLUMN consent_method VARCHAR(50) DEFAULT 'AUTHENTICATED_ELECTRONIC_CONSENT',
    ADD COLUMN consent_ip_address VARCHAR(50) NULL;

