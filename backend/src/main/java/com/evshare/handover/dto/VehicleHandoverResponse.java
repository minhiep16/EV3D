package com.evshare.handover.dto;

import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.InspectionCondition;
import com.evshare.handover.entity.VehicleHandover;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class VehicleHandoverResponse {

    private UUID id;
    private UUID bookingId;
    private Instant bookingStartTime;
    private Instant bookingEndTime;
    private UUID vehicleId;
    private String vehicleName;
    private String licensePlate;
    private UUID staffId;
    private String staffName;
    private UUID coOwnerId;
    private String coOwnerName;
    private String coOwnerEmail;
    private String bookingPurpose;
    private String bookingStatus;
    private String vehicleCode;
    private HandoverStatus status;
    private Instant staffPreparedAt;
    private Instant staffHandedOverAt;
    private Instant ownerReceivedAt;
    private Instant ownerConditionAcknowledgedAt;
    private boolean conditionAcknowledged;
    private Instant createdAt;
    private Instant updatedAt;

    private int totalInspectedCount;
    private int requiredCheckpointsCount = 8;
    private boolean allCheckpointsInspected;
    private boolean hasWarningsOrDamage;
    private List<VehicleInspectionResponse> inspections = new ArrayList<>();

    public VehicleHandoverResponse() {
    }

    public static VehicleHandoverResponse fromEntity(VehicleHandover entity) {
        VehicleHandoverResponse resp = new VehicleHandoverResponse();
        resp.setId(entity.getId());
        if (entity.getBooking() != null) {
            resp.setBookingId(entity.getBooking().getId());
            resp.setBookingStartTime(entity.getBooking().getStartTime());
            resp.setBookingEndTime(entity.getBooking().getEndTime());
            resp.setBookingPurpose(entity.getBooking().getPurpose());
            if (entity.getBooking().getStatus() != null) {
                resp.setBookingStatus(entity.getBooking().getStatus().name());
            }
            if (entity.getBooking().getUser() != null) {
                resp.setCoOwnerEmail(entity.getBooking().getUser().getEmail());
            }
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
            resp.setVehicleCode("EV01");
            resp.setLicensePlate(entity.getVehicle().getLicensePlate());
        }
        if (entity.getStaff() != null) {
            resp.setStaffId(entity.getStaff().getId());
            resp.setStaffName(entity.getStaff().getFullName());
        }
        if (entity.getCoOwner() != null) {
            resp.setCoOwnerId(entity.getCoOwner().getId());
            resp.setCoOwnerName(entity.getCoOwner().getFullName());
            if (resp.getCoOwnerEmail() == null) {
                resp.setCoOwnerEmail(entity.getCoOwner().getEmail());
            }
        }
        resp.setStatus(entity.getStatus());
        resp.setStaffPreparedAt(entity.getStaffPreparedAt());
        resp.setStaffHandedOverAt(entity.getStaffHandedOverAt());
        resp.setOwnerReceivedAt(entity.getOwnerReceivedAt());
        resp.setOwnerConditionAcknowledgedAt(entity.getOwnerConditionAcknowledgedAt());
        resp.setConditionAcknowledged(entity.getOwnerConditionAcknowledgedAt() != null);
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getInspections() != null) {
            List<VehicleInspectionResponse> inspectionResponses = entity.getInspections().stream()
                    .map(VehicleInspectionResponse::fromEntity)
                    .collect(Collectors.toList());
            resp.setInspections(inspectionResponses);
            resp.setTotalInspectedCount(inspectionResponses.size());
            resp.setAllCheckpointsInspected(inspectionResponses.size() >= resp.getRequiredCheckpointsCount());
            resp.setHasWarningsOrDamage(inspectionResponses.stream()
                    .anyMatch(i -> i.getConditionStatus() == InspectionCondition.WARNING || i.getConditionStatus() == InspectionCondition.DAMAGED));
        }

        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public Instant getBookingStartTime() {
        return bookingStartTime;
    }

    public void setBookingStartTime(Instant bookingStartTime) {
        this.bookingStartTime = bookingStartTime;
    }

    public Instant getBookingEndTime() {
        return bookingEndTime;
    }

    public void setBookingEndTime(Instant bookingEndTime) {
        this.bookingEndTime = bookingEndTime;
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

    public UUID getStaffId() {
        return staffId;
    }

    public void setStaffId(UUID staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public UUID getCoOwnerId() {
        return coOwnerId;
    }

    public void setCoOwnerId(UUID coOwnerId) {
        this.coOwnerId = coOwnerId;
    }

    public String getCoOwnerName() {
        return coOwnerName;
    }

    public void setCoOwnerName(String coOwnerName) {
        this.coOwnerName = coOwnerName;
    }

    public HandoverStatus getStatus() {
        return status;
    }

    public void setStatus(HandoverStatus status) {
        this.status = status;
    }

    public Instant getStaffPreparedAt() {
        return staffPreparedAt;
    }

    public void setStaffPreparedAt(Instant staffPreparedAt) {
        this.staffPreparedAt = staffPreparedAt;
    }

    public Instant getStaffHandedOverAt() {
        return staffHandedOverAt;
    }

    public void setStaffHandedOverAt(Instant staffHandedOverAt) {
        this.staffHandedOverAt = staffHandedOverAt;
    }

    public Instant getOwnerReceivedAt() {
        return ownerReceivedAt;
    }

    public void setOwnerReceivedAt(Instant ownerReceivedAt) {
        this.ownerReceivedAt = ownerReceivedAt;
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

    public int getRequiredCheckpointsCount() {
        return requiredCheckpointsCount;
    }

    public void setRequiredCheckpointsCount(int requiredCheckpointsCount) {
        this.requiredCheckpointsCount = requiredCheckpointsCount;
    }

    public boolean isAllCheckpointsInspected() {
        return allCheckpointsInspected;
    }

    public void setAllCheckpointsInspected(boolean allCheckpointsInspected) {
        this.allCheckpointsInspected = allCheckpointsInspected;
    }

    public boolean isHasWarningsOrDamage() {
        return hasWarningsOrDamage;
    }

    public void setHasWarningsOrDamage(boolean hasWarningsOrDamage) {
        this.hasWarningsOrDamage = hasWarningsOrDamage;
    }

    public List<VehicleInspectionResponse> getInspections() {
        return inspections;
    }

    public void setInspections(List<VehicleInspectionResponse> inspections) {
        this.inspections = inspections;
    }

    public String getCoOwnerEmail() {
        return coOwnerEmail;
    }

    public void setCoOwnerEmail(String coOwnerEmail) {
        this.coOwnerEmail = coOwnerEmail;
    }

    public String getBookingPurpose() {
        return bookingPurpose;
    }

    public void setBookingPurpose(String bookingPurpose) {
        this.bookingPurpose = bookingPurpose;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public String getVehicleCode() {
        return vehicleCode != null ? vehicleCode : "EV01";
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public UUID getHandoverId() {
        return getId();
    }

    public HandoverStatus getHandoverStatus() {
        return getStatus();
    }

    public Instant getOwnerConditionAcknowledgedAt() {
        return ownerConditionAcknowledgedAt;
    }

    public void setOwnerConditionAcknowledgedAt(Instant ownerConditionAcknowledgedAt) {
        this.ownerConditionAcknowledgedAt = ownerConditionAcknowledgedAt;
    }

    public boolean isConditionAcknowledged() {
        return conditionAcknowledged;
    }

    public void setConditionAcknowledged(boolean conditionAcknowledged) {
        this.conditionAcknowledged = conditionAcknowledged;
    }
}

