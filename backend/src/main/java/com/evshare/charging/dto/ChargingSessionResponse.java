package com.evshare.charging.dto;

import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.entity.ChargingSessionStatus;
import com.evshare.charging.entity.ChargingStation;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ChargingSessionResponse {

    private UUID id;
    private UUID vehicleId;
    private String vehicleCode;
    private UUID chargingStationId;
    private String chargingStationCode;
    private String chargingStationName;
    private ChargingSessionStatus status;
    private UUID startedByUserId;
    private String startedByUserName;
    private Instant startedAt;
    private Instant endedAt;
    private BigDecimal startSocPercent;
    private BigDecimal currentSocPercent;
    private BigDecimal targetSocPercent;
    private BigDecimal energyDeliveredKwh;
    private BigDecimal powerKw;
    private Integer estimatedRemainingMinutes;
    private String completionReason;
    private Instant createdAt;
    private Instant updatedAt;

    public ChargingSessionResponse() {
    }

    public static ChargingSessionResponse fromEntity(ChargingSession session) {
        return fromEntity(session, null);
    }

    public static ChargingSessionResponse fromEntity(ChargingSession session, Integer estimatedRemainingMinutes) {
        if (session == null) {
            return null;
        }
        ChargingSessionResponse response = new ChargingSessionResponse();
        response.setId(session.getId());
        if (session.getVehicle() != null) {
            response.setVehicleId(session.getVehicle().getId());
            response.setVehicleCode(session.getVehicle().getName());
        }
        if (session.getChargingStation() != null) {
            response.setChargingStationId(session.getChargingStation().getId());
            response.setChargingStationCode(session.getChargingStation().getCode());
            response.setChargingStationName(session.getChargingStation().getName());
        }
        response.setStatus(session.getStatus());
        if (session.getStartedBy() != null) {
            response.setStartedByUserId(session.getStartedBy().getId());
            response.setStartedByUserName(session.getStartedBy().getFullName());
        }
        response.setStartedAt(session.getStartedAt());
        response.setEndedAt(session.getEndedAt());
        response.setStartSocPercent(session.getStartSocPercent());
        response.setCurrentSocPercent(session.getCurrentSocPercent());
        response.setTargetSocPercent(session.getTargetSocPercent());
        response.setEnergyDeliveredKwh(session.getEnergyDeliveredKwh());
        response.setPowerKw(session.getPowerKw());
        response.setEstimatedRemainingMinutes(estimatedRemainingMinutes);
        response.setCompletionReason(session.getCompletionReason());
        response.setCreatedAt(session.getCreatedAt());
        response.setUpdatedAt(session.getUpdatedAt());
        return response;
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

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public UUID getChargingStationId() {
        return chargingStationId;
    }

    public void setChargingStationId(UUID chargingStationId) {
        this.chargingStationId = chargingStationId;
    }

    public String getChargingStationCode() {
        return chargingStationCode;
    }

    public void setChargingStationCode(String chargingStationCode) {
        this.chargingStationCode = chargingStationCode;
    }

    public String getChargingStationName() {
        return chargingStationName;
    }

    public void setChargingStationName(String chargingStationName) {
        this.chargingStationName = chargingStationName;
    }

    public ChargingSessionStatus getStatus() {
        return status;
    }

    public void setStatus(ChargingSessionStatus status) {
        this.status = status;
    }

    public UUID getStartedByUserId() {
        return startedByUserId;
    }

    public void setStartedByUserId(UUID startedByUserId) {
        this.startedByUserId = startedByUserId;
    }

    public String getStartedByUserName() {
        return startedByUserName;
    }

    public void setStartedByUserName(String startedByUserName) {
        this.startedByUserName = startedByUserName;
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

    public Integer getEstimatedRemainingMinutes() {
        return estimatedRemainingMinutes;
    }

    public void setEstimatedRemainingMinutes(Integer estimatedRemainingMinutes) {
        this.estimatedRemainingMinutes = estimatedRemainingMinutes;
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
