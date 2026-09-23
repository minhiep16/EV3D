-- EVShare 3D - Phase 05 Vehicles Schema and Seed Migration

CREATE TABLE IF NOT EXISTS vehicles (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    license_plate VARCHAR(30) NOT NULL UNIQUE,
    vin VARCHAR(50) NOT NULL UNIQUE,
    battery_capacity DECIMAL(6, 2) NOT NULL,
    current_battery_level INT NOT NULL,
    odometer DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    model_3d_url VARCHAR(255) NOT NULL DEFAULT '/models/ev-car.glb',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicles_license_plate (license_plate),
    INDEX idx_vehicles_vin (vin),
    INDEX idx_vehicles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Development Demo Vehicle EV01 (Idempotent INSERT IGNORE)
INSERT IGNORE INTO vehicles (
    id,
    name,
    brand,
    model,
    year,
    license_plate,
    vin,
    battery_capacity,
    current_battery_level,
    odometer,
    status,
    model_3d_url
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'EVShare Demo EV',
    'Demo',
    'EV One',
    2026,
    '51E-123.45',
    'EVSHAREDEMO000001',
    75.00,
    82,
    10200.00,
    'AVAILABLE',
    '/models/ev-car.glb'
);
