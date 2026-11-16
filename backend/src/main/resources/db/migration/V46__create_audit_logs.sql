-- ============================================================================
-- V46: Centralized System Audit Logs
-- Table for tracking security, administrative, and sensitive business events
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    actor_id CHAR(36) NULL,
    actor_email VARCHAR(150) NULL,
    actor_name VARCHAR(120) NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(60) NOT NULL,
    resource_id VARCHAR(100) NULL,
    previous_state TEXT NULL,
    new_state TEXT NULL,
    description VARCHAR(500) NULL,
    ip_address VARCHAR(60) NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_actor_id (actor_id),
    INDEX idx_audit_resource (resource_type, resource_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
