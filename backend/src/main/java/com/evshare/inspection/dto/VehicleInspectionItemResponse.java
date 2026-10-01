package com.evshare.inspection.dto;

import com.evshare.inspection.entity.InspectionItemCondition;
import com.evshare.inspection.entity.VehicleInspectionItem;

import java.time.Instant;
import java.util.UUID;

public class VehicleInspectionItemResponse {

    private UUID id;
    private UUID inspectionId;
    private String vehiclePartCode;
    private InspectionItemCondition conditionStatus;
    private String note;
    private Instant createdAt;

    public VehicleInspectionItemResponse() {
    }

    public static VehicleInspectionItemResponse fromEntity(VehicleInspectionItem entity) {
        VehicleInspectionItemResponse resp = new VehicleInspectionItemResponse();
        resp.setId(entity.getId());
        if (entity.getInspection() != null) {
            resp.setInspectionId(entity.getInspection().getId());
        }
        resp.setVehiclePartCode(entity.getVehiclePartCode());
        resp.setConditionStatus(entity.getConditionStatus());
        resp.setNote(entity.getNote());
        resp.setCreatedAt(entity.getCreatedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getInspectionId() {
        return inspectionId;
    }

    public void setInspectionId(UUID inspectionId) {
        this.inspectionId = inspectionId;
    }

    public String getVehiclePartCode() {
        return vehiclePartCode;
    }

    public void setVehiclePartCode(String vehiclePartCode) {
        this.vehiclePartCode = vehiclePartCode;
    }

    public InspectionItemCondition getConditionStatus() {
        return conditionStatus;
    }

    public void setConditionStatus(InspectionItemCondition conditionStatus) {
        this.conditionStatus = conditionStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
