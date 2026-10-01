package com.evshare.handover.dto;

import com.evshare.handover.entity.InspectionCondition;

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

    public static VehicleInspectionResponse fromItem(com.evshare.inspection.entity.VehicleInspectionItem item, UUID handoverId, com.evshare.user.entity.User inspector, Instant inspectedAt) {
        if (item == null) return null;
        VehicleInspectionResponse resp = new VehicleInspectionResponse();
        resp.setId(item.getId());
        resp.setHandoverId(handoverId);
        resp.setVehiclePartCode(item.getVehiclePartCode());
        if (item.getConditionStatus() != null) {
            String cName = item.getConditionStatus().name();
            if ("GOOD".equals(cName)) resp.setConditionStatus(InspectionCondition.GOOD);
            else if ("WARNING".equals(cName) || "SCRATCH".equals(cName) || "DENT".equals(cName)) resp.setConditionStatus(InspectionCondition.WARNING);
            else resp.setConditionStatus(InspectionCondition.DAMAGED);
        } else {
            resp.setConditionStatus(InspectionCondition.GOOD);
        }
        resp.setNote(item.getNote());
        if (inspector != null) {
            resp.setInspectedById(inspector.getId());
            resp.setInspectedByName(inspector.getFullName());
        }
        resp.setInspectedAt(inspectedAt != null ? inspectedAt : item.getCreatedAt());
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
