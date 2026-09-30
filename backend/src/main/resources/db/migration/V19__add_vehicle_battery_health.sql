-- EVShare 3D - Phase 16: Vehicle Battery Health and High-Voltage System Schema & Seed

CREATE TABLE IF NOT EXISTS vehicle_battery_health (
    id CHAR(36) PRIMARY KEY,
    vehicle_id CHAR(36) NOT NULL UNIQUE,
    state_of_health_percent DECIMAL(5, 2) NOT NULL,
    estimated_range_km DECIMAL(6, 2) NOT NULL,
    capacity_kwh DECIMAL(6, 2) NULL,
    usable_capacity_kwh DECIMAL(6, 2) NULL,
    voltage DECIMAL(6, 2) NULL,
    temperature_celsius DECIMAL(5, 2) NULL,
    cycle_count INT NULL,
    battery_status VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    last_inspected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_battery_health_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_battery_health_vehicle_id (vehicle_id),
    INDEX idx_battery_health_status (battery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Demo Battery Health for EV01 (VinFast VF8 Realistic - Healthy Condition)
INSERT IGNORE INTO vehicle_battery_health (
    id,
    vehicle_id,
    state_of_health_percent,
    estimated_range_km,
    capacity_kwh,
    usable_capacity_kwh,
    voltage,
    temperature_celsius,
    cycle_count,
    battery_status,
    last_inspected_at
) VALUES (
    '88888888-8888-8888-8888-888888888801',
    '11111111-1111-1111-1111-111111111111',
    95.40,
    369.00,
    75.00,
    70.50,
    400.00,
    27.50,
    318,
    'NORMAL',
    '2026-09-28 08:30:00'
);

-- Seed Demo Battery Health for EV02 (Stylized EV Prototype - High Condition)
INSERT IGNORE INTO vehicle_battery_health (
    id,
    vehicle_id,
    state_of_health_percent,
    estimated_range_km,
    capacity_kwh,
    usable_capacity_kwh,
    voltage,
    temperature_celsius,
    cycle_count,
    battery_status,
    last_inspected_at
) VALUES (
    '88888888-8888-8888-8888-888888888802',
    '11111111-1111-1111-1111-111111111102',
    98.20,
    410.00,
    65.00,
    61.50,
    415.00,
    25.00,
    142,
    'NORMAL',
    '2026-09-29 14:15:00'
);
