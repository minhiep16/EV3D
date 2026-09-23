package com.evshare.handover.dto;

import com.evshare.handover.entity.InspectionCondition;
import com.evshare.handover.entity.VehicleInspection;

import java.time.Instant;
import java.util.UUID;

public class VehicleInspectionResponse {

    private UUID id;
    private UUID handoverId;
    private String vehiclePartCode;
    private InspectionCondition conditionStatus;
    private String note;
    private UUID inspectedById;
    private String inspectedByName;
    private Instant inspectedAt;

    public VehicleInspectionResponse() {
    }

    public static VehicleInspectionResponse fromEntity(VehicleInspection entity) {
        VehicleInspectionResponse resp = new VehicleInspectionResponse();
        resp.setId(entity.getId());
        resp.setHandoverId(entity.getHandover().getId());
        resp.setVehiclePartCode(entity.getVehiclePartCode());
        resp.setConditionStatus(entity.getConditionStatus());
        resp.setNote(entity.getNote());
        if (entity.getInspectedBy() != null) {
            resp.setInspectedById(entity.getInspectedBy().getId());
            resp.setInspectedByName(entity.getInspectedBy().getFullName());
        }
        resp.setInspectedAt(entity.getInspectedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public void setHandoverId(UUID handoverId) {
        this.handoverId = handoverId;
    }

    public String getVehiclePartCode() {
        return vehiclePartCode;
    }

    public void setVehiclePartCode(String vehiclePartCode) {
        this.vehiclePartCode = vehiclePartCode;
    }

    public InspectionCondition getConditionStatus() {
        return conditionStatus;
    }

    public void setConditionStatus(InspectionCondition conditionStatus) {
        this.conditionStatus = conditionStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public UUID getInspectedById() {
        return inspectedById;
    }

    public void setInspectedById(UUID inspectedById) {
        this.inspectedById = inspectedById;
    }

    public String getInspectedByName() {
        return inspectedByName;
    }

    public void setInspectedByName(String inspectedByName) {
        this.inspectedByName = inspectedByName;
    }

    public Instant getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(Instant inspectedAt) {
        this.inspectedAt = inspectedAt;
    }
}
