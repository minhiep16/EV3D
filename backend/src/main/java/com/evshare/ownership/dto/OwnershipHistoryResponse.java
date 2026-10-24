package com.evshare.ownership.dto;

import com.evshare.ownership.entity.OwnershipChangeHistory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class OwnershipHistoryResponse {

    private UUID id;
    private UUID groupId;
    private String groupName;
    private UUID vehicleId;
    private String vehicleName;
    private UUID transferRequestId;
    private UUID fromUserId;
    private String fromUserName;
    private UUID toUserId;
    private String toUserName;
    private BigDecimal transferredPercentage;
    private String previousOwnershipSnapshot;
    private String newOwnershipSnapshot;
    private String reason;
    private Instant effectiveAt;
    private Instant recordedAt;
    private String recordedByUserName;

    public OwnershipHistoryResponse() {
    }

    public static OwnershipHistoryResponse fromEntity(OwnershipChangeHistory entity) {
        OwnershipHistoryResponse resp = new OwnershipHistoryResponse();
        resp.setId(entity.getId());
        if (entity.getGroup() != null) {
            resp.setGroupId(entity.getGroup().getId());
            resp.setGroupName(entity.getGroup().getName());
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
        }
        if (entity.getTransferRequest() != null) {
            resp.setTransferRequestId(entity.getTransferRequest().getId());
        }
        if (entity.getFromUser() != null) {
            resp.setFromUserId(entity.getFromUser().getId());
            resp.setFromUserName(entity.getFromUser().getFullName());
        }
        if (entity.getToUser() != null) {
            resp.setToUserId(entity.getToUser().getId());
            resp.setToUserName(entity.getToUser().getFullName());
        }
        resp.setTransferredPercentage(entity.getTransferredPercentage());
        resp.setPreviousOwnershipSnapshot(entity.getPreviousOwnershipSnapshot());
        resp.setNewOwnershipSnapshot(entity.getNewOwnershipSnapshot());
        resp.setReason(entity.getReason());
        resp.setEffectiveAt(entity.getEffectiveAt());
        resp.setRecordedAt(entity.getRecordedAt());
        if (entity.getRecordedByUser() != null) {
            resp.setRecordedByUserName(entity.getRecordedByUser().getFullName());
        }
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
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

    public UUID getTransferRequestId() {
        return transferRequestId;
    }

    public void setTransferRequestId(UUID transferRequestId) {
        this.transferRequestId = transferRequestId;
    }

    public UUID getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(UUID fromUserId) {
        this.fromUserId = fromUserId;
    }

    public String getFromUserName() {
        return fromUserName;
    }

    public void setFromUserName(String fromUserName) {
        this.fromUserName = fromUserName;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public String getToUserName() {
        return toUserName;
    }

    public void setToUserName(String toUserName) {
        this.toUserName = toUserName;
    }

    public BigDecimal getTransferredPercentage() {
        return transferredPercentage;
    }

    public void setTransferredPercentage(BigDecimal transferredPercentage) {
        this.transferredPercentage = transferredPercentage;
    }

    public String getPreviousOwnershipSnapshot() {
        return previousOwnershipSnapshot;
    }

    public void setPreviousOwnershipSnapshot(String previousOwnershipSnapshot) {
        this.previousOwnershipSnapshot = previousOwnershipSnapshot;
    }

    public String getNewOwnershipSnapshot() {
        return newOwnershipSnapshot;
    }

    public void setNewOwnershipSnapshot(String newOwnershipSnapshot) {
        this.newOwnershipSnapshot = newOwnershipSnapshot;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getEffectiveAt() {
        return effectiveAt;
    }

    public void setEffectiveAt(Instant effectiveAt) {
        this.effectiveAt = effectiveAt;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }

    public String getRecordedByUserName() {
        return recordedByUserName;
    }

    public void setRecordedByUserName(String recordedByUserName) {
        this.recordedByUserName = recordedByUserName;
    }
}
