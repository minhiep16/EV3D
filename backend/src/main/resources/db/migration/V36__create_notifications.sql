-- EVShare 3D - Phase 24 Unified Notification Center
-- Authoritative persistent notification storage

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    recipient_user_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NULL,
    group_id CHAR(36) NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36) NULL,
    event_type VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(30) DEFAULT 'INFO',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notif_recipient_read (recipient_user_id, read_at),
    INDEX idx_notif_created_at (created_at),
    INDEX idx_notif_dedup (recipient_user_id, event_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

