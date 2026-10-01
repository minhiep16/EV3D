package com.evshare.inspection.dto;

import com.evshare.inspection.entity.InspectionItemCondition;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.entity.VehicleInspection;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class VehicleInspectionResponse {

    private UUID id;
    private UUID vehicleId;
    private String vehicleName;
    private String licensePlate;
    private UUID inspectedById;
    private String inspectedByName;
    private InspectionType inspectionType;
    private InspectionStatus status;
    private InspectionOverallResult overallResult;
    private String summaryNote;
    private Instant startedAt;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private int totalInspectedCount;
    private int abnormalCount;
    private List<VehicleInspectionItemResponse> items = new ArrayList<>();

    public VehicleInspectionResponse() {
    }

    public static VehicleInspectionResponse fromEntity(VehicleInspection entity) {
        VehicleInspectionResponse resp = new VehicleInspectionResponse();
        resp.setId(entity.getId());
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
            resp.setLicensePlate(entity.getVehicle().getLicensePlate());
        }
        if (entity.getInspectedBy() != null) {
            resp.setInspectedById(entity.getInspectedBy().getId());
            resp.setInspectedByName(entity.getInspectedBy().getFullName());
        }
        resp.setInspectionType(entity.getInspectionType());
        resp.setStatus(entity.getStatus());
        resp.setOverallResult(entity.getOverallResult());
        resp.setSummaryNote(entity.getSummaryNote());
        resp.setStartedAt(entity.getStartedAt());
        resp.setCompletedAt(entity.getCompletedAt());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getItems() != null) {
            List<VehicleInspectionItemResponse> itemResponses = entity.getItems().stream()
                    .map(VehicleInspectionItemResponse::fromEntity)
                    .collect(Collectors.toList());
            resp.setItems(itemResponses);
            resp.setTotalInspectedCount(itemResponses.size());
            long abnormalities = itemResponses.stream()
                    .filter(i -> i.getConditionStatus() != InspectionItemCondition.GOOD)
                    .count();
            resp.setAbnormalCount((int) abnormalities);
        }

        return resp;
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

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
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

    public InspectionType getInspectionType() {
        return inspectionType;
    }

    public void setInspectionType(InspectionType inspectionType) {
        this.inspectionType = inspectionType;
    }

    public InspectionStatus getStatus() {
        return status;
    }

    public void setStatus(InspectionStatus status) {
        this.status = status;
    }

    public InspectionOverallResult getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(InspectionOverallResult overallResult) {
        this.overallResult = overallResult;
    }

    public String getSummaryNote() {
        return summaryNote;
    }

    public void setSummaryNote(String summaryNote) {
        this.summaryNote = summaryNote;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
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

    public int getTotalInspectedCount() {
        return totalInspectedCount;
    }

    public void setTotalInspectedCount(int totalInspectedCount) {
        this.totalInspectedCount = totalInspectedCount;
    }

    public int getAbnormalCount() {
        return abnormalCount;
    }

    public void setAbnormalCount(int abnormalCount) {
        this.abnormalCount = abnormalCount;
    }

    public List<VehicleInspectionItemResponse> getItems() {
        return items;
    }

    public void setItems(List<VehicleInspectionItemResponse> items) {
        this.items = items;
    }
}
