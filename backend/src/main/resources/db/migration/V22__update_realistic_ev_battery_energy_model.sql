-- EVShare 3D - Phase 17/18: Realistic EV Battery and Energy Consumption Model Migration
-- Introduces realistic rated energy consumption and battery capacity specifications

-- 1. Extend vehicles table with gross capacity, usable capacity, and rated consumption
ALTER TABLE vehicles 
    ADD COLUMN gross_battery_capacity_kwh DECIMAL(6, 2) NULL AFTER battery_capacity,
    ADD COLUMN usable_battery_capacity_kwh DECIMAL(6, 2) NULL AFTER gross_battery_capacity_kwh,
    ADD COLUMN energy_consumption_kwh_per_100km DECIMAL(6, 2) NULL AFTER usable_battery_capacity_kwh;

-- 2. Extend trips table with precise end SOC, energy consumed, and SOC consumed
ALTER TABLE trips
    ADD COLUMN end_soc_percent DECIMAL(5, 2) NULL AFTER end_battery_level,
    ADD COLUMN energy_consumed_kwh DECIMAL(8, 3) NULL AFTER end_soc_percent,
    ADD COLUMN soc_consumed_percent DECIMAL(5, 2) NULL AFTER energy_consumed_kwh;

-- 3. Seed Realistic EV Specifications for EV01 (Compact electric SUV, Volvo EX30-like)
-- grossBatteryCapacityKwh = 69, usableBatteryCapacityKwh = 65, energyConsumptionKwhPer100Km = 17.5
UPDATE vehicles
SET battery_capacity = 69.00,
    gross_battery_capacity_kwh = 69.00,
    usable_battery_capacity_kwh = 65.00,
    energy_consumption_kwh_per_100km = 17.50
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Update EV01 battery health
UPDATE vehicle_battery_health
SET capacity_kwh = 69.00,
    usable_capacity_kwh = 65.00
WHERE vehicle_id = '11111111-1111-1111-1111-111111111111';

-- 4. Seed Realistic EV Specifications for EV02 (Lighter stylized EV)
-- usableBatteryCapacityKwh = 60, energyConsumptionKwhPer100Km = 16.5
UPDATE vehicles
SET battery_capacity = 65.00,
    gross_battery_capacity_kwh = 65.00,
    usable_battery_capacity_kwh = 60.00,
    energy_consumption_kwh_per_100km = 16.50
WHERE id = '11111111-1111-1111-1111-111111111102';

-- Update EV02 battery health
UPDATE vehicle_battery_health
SET capacity_kwh = 65.00,
    usable_capacity_kwh = 60.00
WHERE vehicle_id = '11111111-1111-1111-1111-111111111102';
