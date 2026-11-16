package com.evshare.energy.dto;

import com.evshare.energy.entity.VehicleEnergyInventory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class VehicleEnergyInventoryResponse {

    private UUID id;
    private UUID vehicleId;
    private String vehicleName;
    private BigDecimal availableEnergyKwh;
    private BigDecimal totalInventoryCost;
    private BigDecimal weightedAverageCostPerKwh;
    private BigDecimal totalEnergyChargedKwh;
    private BigDecimal totalEnergyConsumedKwh;
    private BigDecimal totalCostCharged;
    private BigDecimal totalCostConsumed;
    private UUID lastChargingSessionId;
    private UUID lastTripId;
    private Boolean isReconciliationRequired;
    private String reconciliationNote;
    private BigDecimal usableBatteryCapacityKwh;
    private Integer currentBatteryLevel;
    private Instant createdAt;
    private Instant updatedAt;

    public VehicleEnergyInventoryResponse() {
    }

    public static VehicleEnergyInventoryResponse fromEntity(VehicleEnergyInventory inventory) {
        if (inventory == null) return null;
        VehicleEnergyInventoryResponse resp = new VehicleEnergyInventoryResponse();
        resp.setId(inventory.getId());
        if (inventory.getVehicle() != null) {
            resp.setVehicleId(inventory.getVehicle().getId());
            resp.setVehicleName(inventory.getVehicle().getName());
            resp.setCurrentBatteryLevel(inventory.getVehicle().getCurrentBatteryLevel());
            resp.setUsableBatteryCapacityKwh(inventory.getVehicle().getUsableBatteryCapacityKwh());
        }
        resp.setAvailableEnergyKwh(inventory.getAvailableEnergyKwh());
        resp.setTotalInventoryCost(inventory.getTotalInventoryCost());
        resp.setWeightedAverageCostPerKwh(inventory.getWeightedAverageCostPerKwh());
        resp.setTotalEnergyChargedKwh(inventory.getTotalEnergyChargedKwh());
        resp.setTotalEnergyConsumedKwh(inventory.getTotalEnergyConsumedKwh());
        resp.setTotalCostCharged(inventory.getTotalCostCharged());
        resp.setTotalCostConsumed(inventory.getTotalCostConsumed());
        resp.setLastChargingSessionId(inventory.getLastChargingSessionId());
        resp.setLastTripId(inventory.getLastTripId());
        resp.setIsReconciliationRequired(inventory.getIsReconciliationRequired());
        resp.setReconciliationNote(inventory.getReconciliationNote());
        resp.setCreatedAt(inventory.getCreatedAt());
        resp.setUpdatedAt(inventory.getUpdatedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public BigDecimal getAvailableEnergyKwh() {
        return availableEnergyKwh;
    }

    public void setAvailableEnergyKwh(BigDecimal availableEnergyKwh) {
        this.availableEnergyKwh = availableEnergyKwh;
    }

    public BigDecimal getTotalInventoryCost() {
        return totalInventoryCost;
    }

    public void setTotalInventoryCost(BigDecimal totalInventoryCost) {
        this.totalInventoryCost = totalInventoryCost;
    }

    public BigDecimal getWeightedAverageCostPerKwh() {
        return weightedAverageCostPerKwh;
    }

    public void setWeightedAverageCostPerKwh(BigDecimal weightedAverageCostPerKwh) {
        this.weightedAverageCostPerKwh = weightedAverageCostPerKwh;
    }

    public BigDecimal getTotalEnergyChargedKwh() {
        return totalEnergyChargedKwh;
    }

    public void setTotalEnergyChargedKwh(BigDecimal totalEnergyChargedKwh) {
        this.totalEnergyChargedKwh = totalEnergyChargedKwh;
    }

    public BigDecimal getTotalEnergyConsumedKwh() {
        return totalEnergyConsumedKwh;
    }

    public void setTotalEnergyConsumedKwh(BigDecimal totalEnergyConsumedKwh) {
        this.totalEnergyConsumedKwh = totalEnergyConsumedKwh;
    }

    public BigDecimal getTotalCostCharged() {
        return totalCostCharged;
    }

    public void setTotalCostCharged(BigDecimal totalCostCharged) {
        this.totalCostCharged = totalCostCharged;
    }

    public BigDecimal getTotalCostConsumed() {
        return totalCostConsumed;
    }

    public void setTotalCostConsumed(BigDecimal totalCostConsumed) {
        this.totalCostConsumed = totalCostConsumed;
    }

    public UUID getLastChargingSessionId() {
        return lastChargingSessionId;
    }

    public void setLastChargingSessionId(UUID lastChargingSessionId) {
        this.lastChargingSessionId = lastChargingSessionId;
    }

    public UUID getLastTripId() {
        return lastTripId;
    }

    public void setLastTripId(UUID lastTripId) {
        this.lastTripId = lastTripId;
    }

    public Boolean getIsReconciliationRequired() {
        return isReconciliationRequired;
    }

    public void setIsReconciliationRequired(Boolean isReconciliationRequired) {
        this.isReconciliationRequired = isReconciliationRequired;
    }

    public String getReconciliationNote() {
        return reconciliationNote;
    }

    public void setReconciliationNote(String reconciliationNote) {
        this.reconciliationNote = reconciliationNote;
    }

    public BigDecimal getUsableBatteryCapacityKwh() {
        return usableBatteryCapacityKwh;
    }

    public void setUsableBatteryCapacityKwh(BigDecimal usableBatteryCapacityKwh) {
        this.usableBatteryCapacityKwh = usableBatteryCapacityKwh;
    }

    public Integer getCurrentBatteryLevel() {
        return currentBatteryLevel;
    }

    public void setCurrentBatteryLevel(Integer currentBatteryLevel) {
        this.currentBatteryLevel = currentBatteryLevel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
