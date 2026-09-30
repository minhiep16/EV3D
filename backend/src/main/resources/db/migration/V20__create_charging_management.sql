-- EVShare 3D - Phase 17: Charging Stations and Charging Sessions Management Schema & Seed

CREATE TABLE IF NOT EXISTS charging_stations (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    max_power_kw DECIMAL(6, 2) NOT NULL DEFAULT 150.00,
    connector_type VARCHAR(30) NOT NULL DEFAULT 'CCS2',
    location_label VARCHAR(100) NULL,
    pos_x DECIMAL(6, 2) NULL,
    pos_y DECIMAL(6, 2) NULL,
    pos_z DECIMAL(6, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_charging_stations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS charging_sessions (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL,
    charging_station_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_by_user_id CHAR(36) NOT NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    start_soc_percent DECIMAL(5, 2) NOT NULL,
    current_soc_percent DECIMAL(5, 2) NOT NULL,
    target_soc_percent DECIMAL(5, 2) NOT NULL,
    energy_delivered_kwh DECIMAL(6, 2) NULL DEFAULT 0.00,
    power_kw DECIMAL(6, 2) NULL,
    completion_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_charging_session_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_charging_session_station FOREIGN KEY (charging_station_id) REFERENCES charging_stations(id) ON DELETE CASCADE,
    CONSTRAINT fk_charging_session_user FOREIGN KEY (started_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_charging_session_vehicle (vehicle_id),
    INDEX idx_charging_session_station (charging_station_id),
    INDEX idx_charging_session_status (status),
    INDEX idx_charging_session_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Demo Charging Stations aligned with 3D Garage Bay coordinates
INSERT IGNORE INTO charging_stations (
    id,
    code,
    name,
    status,
    max_power_kw,
    connector_type,
    location_label,
    pos_x,
    pos_y,
    pos_z
) VALUES (
    '77777777-7777-7777-7777-777777777701',
    'CS01',
    'Trạm sạc siêu nhanh DC 01',
    'AVAILABLE',
    150.00,
    'CCS2',
    'Khoang sạc DC 1 — Sảnh Đông',
    6.50,
    0.14,
    0.50
);

INSERT IGNORE INTO charging_stations (
    id,
    code,
    name,
    status,
    max_power_kw,
    connector_type,
    location_label,
    pos_x,
    pos_y,
    pos_z
) VALUES (
    '77777777-7777-7777-7777-777777777702',
    'CS02',
    'Trạm sạc nhanh DC 02',
    'AVAILABLE',
    60.00,
    'CCS2',
    'Khoang sạc DC 2 — Sảnh Nam',
    6.50,
    0.14,
    -3.80
);
