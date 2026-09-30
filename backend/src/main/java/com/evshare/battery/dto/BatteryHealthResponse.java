package com.evshare.battery.dto;

import com.evshare.battery.entity.BatteryStatus;
import com.evshare.battery.entity.VehicleBatteryHealth;
import com.evshare.vehicle.entity.Vehicle;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class BatteryHealthResponse {

    private UUID vehicleId;
    private String vehicleCode;
    private BigDecimal stateOfChargePercent;
    private BigDecimal stateOfHealthPercent;
    private BigDecimal estimatedRangeKm;
    private BigDecimal capacityKwh;
    private BigDecimal usableCapacityKwh;
    private BigDecimal voltage;
    private BigDecimal temperatureCelsius;
    private Integer cycleCount;
    private BatteryStatus batteryStatus;
    private Instant lastInspectedAt;
    private Instant updatedAt;

    public BatteryHealthResponse() {
    }

    public static BatteryHealthResponse fromEntity(VehicleBatteryHealth health, Vehicle vehicle) {
        BatteryHealthResponse response = new BatteryHealthResponse();
        response.setVehicleId(vehicle.getId());
        response.setVehicleCode(vehicle.getName());

        // Single Source of Truth: vehicle.currentBatteryLevel is authoritative for SOC
        BigDecimal soc = vehicle.getCurrentBatteryLevel() != null
                ? BigDecimal.valueOf(vehicle.getCurrentBatteryLevel())
                : BigDecimal.ZERO;
        response.setStateOfChargePercent(soc);

        response.setStateOfHealthPercent(health.getStateOfHealthPercent());
        response.setEstimatedRangeKm(health.getEstimatedRangeKm());

        BigDecimal capacity = health.getCapacityKwh() != null
                ? health.getCapacityKwh()
                : vehicle.getBatteryCapacity();
        response.setCapacityKwh(capacity);

        response.setUsableCapacityKwh(health.getUsableCapacityKwh());
        response.setVoltage(health.getVoltage());
        response.setTemperatureCelsius(health.getTemperatureCelsius());
        response.setCycleCount(health.getCycleCount());
        response.setBatteryStatus(health.getBatteryStatus());
        response.setLastInspectedAt(health.getLastInspectedAt());
        response.setUpdatedAt(health.getUpdatedAt());

        return response;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public BigDecimal getStateOfChargePercent() {
        return stateOfChargePercent;
    }

    public void setStateOfChargePercent(BigDecimal stateOfChargePercent) {
        this.stateOfChargePercent = stateOfChargePercent;
    }

    public BigDecimal getStateOfHealthPercent() {
        return stateOfHealthPercent;
    }

    public void setStateOfHealthPercent(BigDecimal stateOfHealthPercent) {
        this.stateOfHealthPercent = stateOfHealthPercent;
    }

    public BigDecimal getEstimatedRangeKm() {
        return estimatedRangeKm;
    }

    public void setEstimatedRangeKm(BigDecimal estimatedRangeKm) {
        this.estimatedRangeKm = estimatedRangeKm;
    }

    public BigDecimal getCapacityKwh() {
        return capacityKwh;
    }

    public void setCapacityKwh(BigDecimal capacityKwh) {
        this.capacityKwh = capacityKwh;
    }

    public BigDecimal getUsableCapacityKwh() {
        return usableCapacityKwh;
    }

    public void setUsableCapacityKwh(BigDecimal usableCapacityKwh) {
        this.usableCapacityKwh = usableCapacityKwh;
    }

    public BigDecimal getVoltage() {
        return voltage;
    }

    public void setVoltage(BigDecimal voltage) {
        this.voltage = voltage;
    }

    public BigDecimal getTemperatureCelsius() {
        return temperatureCelsius;
    }

    public void setTemperatureCelsius(BigDecimal temperatureCelsius) {
        this.temperatureCelsius = temperatureCelsius;
    }

    public Integer getCycleCount() {
        return cycleCount;
    }

    public void setCycleCount(Integer cycleCount) {
        this.cycleCount = cycleCount;
    }

    public BatteryStatus getBatteryStatus() {
        return batteryStatus;
    }

    public void setBatteryStatus(BatteryStatus batteryStatus) {
        this.batteryStatus = batteryStatus;
    }

    public Instant getLastInspectedAt() {
        return lastInspectedAt;
    }

    public void setLastInspectedAt(Instant lastInspectedAt) {
        this.lastInspectedAt = lastInspectedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
