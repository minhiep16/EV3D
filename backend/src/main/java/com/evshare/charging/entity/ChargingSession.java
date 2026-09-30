package com.evshare.charging.entity;

import com.evshare.user.entity.User;
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
@Table(name = "charging_sessions")
public class ChargingSession {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charging_station_id", referencedColumnName = "id", nullable = false)
    private ChargingStation chargingStation;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ChargingSessionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_by_user_id", referencedColumnName = "id", nullable = false)
    private User startedBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "start_soc_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal startSocPercent;

    @Column(name = "current_soc_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal currentSocPercent;

    @Column(name = "target_soc_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal targetSocPercent;

    @Column(name = "energy_delivered_kwh", precision = 6, scale = 2)
    private BigDecimal energyDeliveredKwh;

    @Column(name = "power_kw", precision = 6, scale = 2)
    private BigDecimal powerKw;

    @Column(name = "completion_reason", length = 255)
    private String completionReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ChargingSession() {
    }

    public ChargingSession(
            UUID id,
            Vehicle vehicle,
            ChargingStation chargingStation,
            ChargingSessionStatus status,
            User startedBy,
            Instant startedAt,
            BigDecimal startSocPercent,
            BigDecimal currentSocPercent,
            BigDecimal targetSocPercent,
            BigDecimal powerKw
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.chargingStation = chargingStation;
        this.status = status != null ? status : ChargingSessionStatus.PENDING;
        this.startedBy = startedBy;
        this.startedAt = startedAt;
        this.startSocPercent = startSocPercent;
        this.currentSocPercent = currentSocPercent != null ? currentSocPercent : startSocPercent;
        this.targetSocPercent = targetSocPercent;
        this.powerKw = powerKw;
        this.energyDeliveredKwh = BigDecimal.ZERO;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = ChargingSessionStatus.PENDING;
        }
        if (this.currentSocPercent == null) {
            this.currentSocPercent = this.startSocPercent;
        }
        if (this.energyDeliveredKwh == null) {
            this.energyDeliveredKwh = BigDecimal.ZERO;
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

    public ChargingStation getChargingStation() {
        return chargingStation;
    }

    public void setChargingStation(ChargingStation chargingStation) {
        this.chargingStation = chargingStation;
    }

    public ChargingSessionStatus getStatus() {
        return status;
    }

    public void setStatus(ChargingSessionStatus status) {
        this.status = status;
    }

    public User getStartedBy() {
        return startedBy;
    }

    public void setStartedBy(User startedBy) {
        this.startedBy = startedBy;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public BigDecimal getStartSocPercent() {
        return startSocPercent;
    }

    public void setStartSocPercent(BigDecimal startSocPercent) {
        this.startSocPercent = startSocPercent;
    }

    public BigDecimal getCurrentSocPercent() {
        return currentSocPercent;
    }

    public void setCurrentSocPercent(BigDecimal currentSocPercent) {
        this.currentSocPercent = currentSocPercent;
    }

    public BigDecimal getTargetSocPercent() {
        return targetSocPercent;
    }

    public void setTargetSocPercent(BigDecimal targetSocPercent) {
        this.targetSocPercent = targetSocPercent;
    }

    public BigDecimal getEnergyDeliveredKwh() {
        return energyDeliveredKwh;
    }

    public void setEnergyDeliveredKwh(BigDecimal energyDeliveredKwh) {
        this.energyDeliveredKwh = energyDeliveredKwh;
    }

    public BigDecimal getPowerKw() {
        return powerKw;
    }

    public void setPowerKw(BigDecimal powerKw) {
        this.powerKw = powerKw;
    }

    public String getCompletionReason() {
        return completionReason;
    }

    public void setCompletionReason(String completionReason) {
        this.completionReason = completionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
