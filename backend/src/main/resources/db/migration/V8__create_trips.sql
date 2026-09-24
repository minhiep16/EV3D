-- EVShare 3D - Phase 10 Trips Schema and Constraints Migration

CREATE TABLE IF NOT EXISTS trips (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL UNIQUE,
    vehicle_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    start_odometer DECIMAL(10, 2) NOT NULL,
    end_odometer DECIMAL(10, 2) NULL,
    start_battery_level INT NOT NULL,
    end_battery_level INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trips_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_trips_booking (booking_id),
    INDEX idx_trips_vehicle (vehicle_id),
    INDEX idx_trips_user (user_id),
    INDEX idx_trips_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
