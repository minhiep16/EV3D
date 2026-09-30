package com.evshare.battery.entity;

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
@Table(name = "vehicle_battery_health")
public class VehicleBatteryHealth {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id", nullable = false, unique = true)
    private Vehicle vehicle;

    @Column(name = "state_of_health_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal stateOfHealthPercent;

    @Column(name = "estimated_range_km", precision = 6, scale = 2, nullable = false)
    private BigDecimal estimatedRangeKm;

    @Column(name = "capacity_kwh", precision = 6, scale = 2)
    private BigDecimal capacityKwh;

    @Column(name = "usable_capacity_kwh", precision = 6, scale = 2)
    private BigDecimal usableCapacityKwh;

    @Column(name = "voltage", precision = 6, scale = 2)
    private BigDecimal voltage;

    @Column(name = "temperature_celsius", precision = 5, scale = 2)
    private BigDecimal temperatureCelsius;

    @Column(name = "cycle_count")
    private Integer cycleCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "battery_status", length = 30, nullable = false)
    private BatteryStatus batteryStatus;

    @Column(name = "last_inspected_at")
    private Instant lastInspectedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleBatteryHealth() {
    }

    public VehicleBatteryHealth(
            UUID id,
            Vehicle vehicle,
            BigDecimal stateOfHealthPercent,
            BigDecimal estimatedRangeKm,
            BigDecimal capacityKwh,
            BigDecimal usableCapacityKwh,
            BigDecimal voltage,
            BigDecimal temperatureCelsius,
            Integer cycleCount,
            BatteryStatus batteryStatus,
            Instant lastInspectedAt
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.stateOfHealthPercent = stateOfHealthPercent;
        this.estimatedRangeKm = estimatedRangeKm;
        this.capacityKwh = capacityKwh;
        this.usableCapacityKwh = usableCapacityKwh;
        this.voltage = voltage;
        this.temperatureCelsius = temperatureCelsius;
        this.cycleCount = cycleCount;
        this.batteryStatus = batteryStatus != null ? batteryStatus : BatteryStatus.NORMAL;
        this.lastInspectedAt = lastInspectedAt;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.batteryStatus == null) {
            this.batteryStatus = BatteryStatus.NORMAL;
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
