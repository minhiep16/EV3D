package com.evshare.charging.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "charging_stations")
public class ChargingStation {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ChargingStationStatus status;

    @Column(name = "max_power_kw", precision = 6, scale = 2, nullable = false)
    private BigDecimal maxPowerKw;

    @Enumerated(EnumType.STRING)
    @Column(name = "connector_type", length = 30, nullable = false)
    private ChargingConnectorType connectorType;

    @Column(name = "location_label", length = 100)
    private String locationLabel;

    @Column(name = "pos_x", precision = 6, scale = 2)
    private BigDecimal posX;

    @Column(name = "pos_y", precision = 6, scale = 2)
    private BigDecimal posY;

    @Column(name = "pos_z", precision = 6, scale = 2)
    private BigDecimal posZ;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ChargingStation() {
    }

    public ChargingStation(
            UUID id,
            String code,
            String name,
            ChargingStationStatus status,
            BigDecimal maxPowerKw,
            ChargingConnectorType connectorType,
            String locationLabel,
            BigDecimal posX,
            BigDecimal posY,
            BigDecimal posZ
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.code = code;
        this.name = name;
        this.status = status != null ? status : ChargingStationStatus.AVAILABLE;
        this.maxPowerKw = maxPowerKw != null ? maxPowerKw : BigDecimal.valueOf(150.0);
        this.connectorType = connectorType != null ? connectorType : ChargingConnectorType.CCS2;
        this.locationLabel = locationLabel;
        this.posX = posX;
        this.posY = posY;
        this.posZ = posZ;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = ChargingStationStatus.AVAILABLE;
        }
        if (this.connectorType == null) {
            this.connectorType = ChargingConnectorType.CCS2;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ChargingStationStatus getStatus() {
        return status;
    }

    public void setStatus(ChargingStationStatus status) {
        this.status = status;
    }

    public BigDecimal getMaxPowerKw() {
        return maxPowerKw;
    }

    public void setMaxPowerKw(BigDecimal maxPowerKw) {
        this.maxPowerKw = maxPowerKw;
    }

    public ChargingConnectorType getConnectorType() {
        return connectorType;
    }

    public void setConnectorType(ChargingConnectorType connectorType) {
        this.connectorType = connectorType;
    }

    public String getLocationLabel() {
        return locationLabel;
    }

    public void setLocationLabel(String locationLabel) {
        this.locationLabel = locationLabel;
    }

    public BigDecimal getPosX() {
        return posX;
    }

    public void setPosX(BigDecimal posX) {
        this.posX = posX;
    }

    public BigDecimal getPosY() {
        return posY;
    }

    public void setPosY(BigDecimal posY) {
        this.posY = posY;
    }

    public BigDecimal getPosZ() {
        return posZ;
    }

    public void setPosZ(BigDecimal posZ) {
        this.posZ = posZ;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
