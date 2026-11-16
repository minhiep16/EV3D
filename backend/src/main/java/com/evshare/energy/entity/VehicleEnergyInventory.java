package com.evshare.energy.entity;

import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicle_energy_inventories")
public class VehicleEnergyInventory {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id", nullable = false, unique = true)
    private Vehicle vehicle;

    @Column(name = "available_energy_kwh", precision = 10, scale = 3, nullable = false)
    private BigDecimal availableEnergyKwh = BigDecimal.ZERO;

    @Column(name = "total_inventory_cost", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalInventoryCost = BigDecimal.ZERO;

    @Column(name = "weighted_average_cost_per_kwh", precision = 10, scale = 2, nullable = false)
    private BigDecimal weightedAverageCostPerKwh = BigDecimal.ZERO;

    @Column(name = "total_energy_charged_kwh", precision = 12, scale = 3, nullable = false)
    private BigDecimal totalEnergyChargedKwh = BigDecimal.ZERO;

    @Column(name = "total_energy_consumed_kwh", precision = 12, scale = 3, nullable = false)
    private BigDecimal totalEnergyConsumedKwh = BigDecimal.ZERO;

    @Column(name = "total_cost_charged", precision = 16, scale = 2, nullable = false)
    private BigDecimal totalCostCharged = BigDecimal.ZERO;

    @Column(name = "total_cost_consumed", precision = 16, scale = 2, nullable = false)
    private BigDecimal totalCostConsumed = BigDecimal.ZERO;

    @Column(name = "last_charging_session_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID lastChargingSessionId;

    @Column(name = "last_trip_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID lastTripId;

    @Column(name = "is_reconciliation_required", nullable = false)
    private Boolean isReconciliationRequired = false;

    @Column(name = "reconciliation_note", length = 500)
    private String reconciliationNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleEnergyInventory() {
    }

    public VehicleEnergyInventory(
            UUID id,
            Vehicle vehicle,
            BigDecimal availableEnergyKwh,
            BigDecimal totalInventoryCost,
            BigDecimal weightedAverageCostPerKwh
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.availableEnergyKwh = availableEnergyKwh != null ? availableEnergyKwh : BigDecimal.ZERO;
        this.totalInventoryCost = totalInventoryCost != null ? totalInventoryCost : BigDecimal.ZERO;
        this.weightedAverageCostPerKwh = weightedAverageCostPerKwh != null ? weightedAverageCostPerKwh : BigDecimal.ZERO;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.availableEnergyKwh == null) {
            this.availableEnergyKwh = BigDecimal.ZERO;
        }
        if (this.totalInventoryCost == null) {
            this.totalInventoryCost = BigDecimal.ZERO;
        }
        if (this.weightedAverageCostPerKwh == null) {
            this.weightedAverageCostPerKwh = BigDecimal.ZERO;
        }
        if (this.totalEnergyChargedKwh == null) {
            this.totalEnergyChargedKwh = BigDecimal.ZERO;
        }
        if (this.totalEnergyConsumedKwh == null) {
            this.totalEnergyConsumedKwh = BigDecimal.ZERO;
        }
        if (this.totalCostCharged == null) {
            this.totalCostCharged = BigDecimal.ZERO;
        }
        if (this.totalCostConsumed == null) {
            this.totalCostConsumed = BigDecimal.ZERO;
        }
        if (this.isReconciliationRequired == null) {
            this.isReconciliationRequired = false;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
