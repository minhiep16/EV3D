package com.evshare.charging.dto;

import com.evshare.charging.entity.ChargingConnectorType;
import com.evshare.charging.entity.ChargingStation;
import com.evshare.charging.entity.ChargingStationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ChargingStationResponse {

    private UUID id;
    private String code;
    private String name;
    private ChargingStationStatus status;
    private BigDecimal maxPowerKw;
    private ChargingConnectorType connectorType;
    private String locationLabel;
    private BigDecimal posX;
    private BigDecimal posY;
    private BigDecimal posZ;
    private Instant createdAt;
    private Instant updatedAt;

    public ChargingStationResponse() {
    }

    public static ChargingStationResponse fromEntity(ChargingStation station) {
        ChargingStationResponse response = new ChargingStationResponse();
        response.setId(station.getId());
        response.setCode(station.getCode());
        response.setName(station.getName());
        response.setStatus(station.getStatus());
        response.setMaxPowerKw(station.getMaxPowerKw());
        response.setConnectorType(station.getConnectorType());
        response.setLocationLabel(station.getLocationLabel());
        response.setPosX(station.getPosX());
        response.setPosY(station.getPosY());
        response.setPosZ(station.getPosZ());
        response.setCreatedAt(station.getCreatedAt());
        response.setUpdatedAt(station.getUpdatedAt());
        return response;
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
