package com.evshare.maintenance.dto;

import com.evshare.maintenance.entity.MaintenancePriority;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.entity.MaintenanceType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class MaintenanceResponse {

    private UUID id;
    private UUID vehicleId;
    private MaintenanceStatus status;
    private MaintenancePriority priority;
    private MaintenanceType maintenanceType;
    private String title;
    private String description;
    private Instant scheduledAt;
    private Instant startedAt;
    private Instant completedAt;
    private Instant approvedAt;
    private BigDecimal approvedWeight;
    private UUID createdById;
    private String createdByName;
    private UUID assignedStaffId;
    private String assignedStaffName;
    private String completionNote;
    private List<UUID> damageRecordIds;
    private List<LinkedDamageDto> damageRecords;
    private Instant createdAt;
    private Instant updatedAt;

    public static class LinkedDamageDto {
        private UUID id;
        private String vehiclePartCode;
        private String damageType;
        private String severity;
        private String status;
        private String note;
        private BigDecimal localPositionX;
        private BigDecimal localPositionY;
        private BigDecimal localPositionZ;

        public LinkedDamageDto() {}

        public LinkedDamageDto(UUID id, String vehiclePartCode, String damageType, String severity, String status, String note, BigDecimal localPositionX, BigDecimal localPositionY, BigDecimal localPositionZ) {
            this.id = id;
            this.vehiclePartCode = vehiclePartCode;
            this.damageType = damageType;
            this.severity = severity;
            this.status = status;
            this.note = note;
            this.localPositionX = localPositionX;
            this.localPositionY = localPositionY;
            this.localPositionZ = localPositionZ;
        }

        public UUID getId() { return id; }
        public String getVehiclePartCode() { return vehiclePartCode; }
        public String getDamageType() { return damageType; }
        public String getSeverity() { return severity; }
        public String getStatus() { return status; }
        public String getNote() { return note; }
        public BigDecimal getLocalPositionX() { return localPositionX; }
        public BigDecimal getLocalPositionY() { return localPositionY; }
        public BigDecimal getLocalPositionZ() { return localPositionZ; }
    }

    public static MaintenanceResponse fromEntity(MaintenanceRequest entity) {
        if (entity == null) return null;
        MaintenanceResponse dto = new MaintenanceResponse();
        dto.setId(entity.getId());
        dto.setVehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null);
        dto.setStatus(entity.getStatus());
        dto.setPriority(entity.getPriority());
        dto.setMaintenanceType(entity.getMaintenanceType());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setScheduledAt(entity.getScheduledAt());
        dto.setStartedAt(entity.getStartedAt());
        dto.setCompletedAt(entity.getCompletedAt());
        dto.setApprovedAt(entity.getApprovedAt());
        dto.setApprovedWeight(entity.getApprovedWeight());

        if (entity.getCreatedBy() != null) {
            dto.setCreatedById(entity.getCreatedBy().getId());
            dto.setCreatedByName(entity.getCreatedBy().getFullName());
        }

        if (entity.getAssignedStaff() != null) {
            dto.setAssignedStaffId(entity.getAssignedStaff().getId());
            dto.setAssignedStaffName(entity.getAssignedStaff().getFullName());
        }

        dto.setCompletionNote(entity.getCompletionNote());

        if (entity.getDamageRecords() != null && !entity.getDamageRecords().isEmpty()) {
            dto.setDamageRecordIds(entity.getDamageRecords().stream()
                    .map(d -> d.getId())
                    .collect(Collectors.toList()));
            dto.setDamageRecords(entity.getDamageRecords().stream()
                    .map(d -> new LinkedDamageDto(
                            d.getId(),
                            d.getVehiclePartCode(),
                            d.getDamageType() != null ? d.getDamageType().name() : null,
                            d.getSeverity() != null ? d.getSeverity().name() : null,
                            d.getStatus() != null ? d.getStatus().name() : "OPEN",
                            d.getNote(),
                            d.getLocalPositionX(),
                            d.getLocalPositionY(),
                            d.getLocalPositionZ()
                    ))
                    .collect(Collectors.toList()));
        } else {
            dto.setDamageRecordIds(Collections.emptyList());
            dto.setDamageRecords(Collections.emptyList());
        }

        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }

    public MaintenanceStatus getStatus() { return status; }
    public void setStatus(MaintenanceStatus status) { this.status = status; }

    public MaintenancePriority getPriority() { return priority; }
    public void setPriority(MaintenancePriority priority) { this.priority = priority; }

    public MaintenanceType getMaintenanceType() { return maintenanceType; }
    public void setMaintenanceType(MaintenanceType maintenanceType) { this.maintenanceType = maintenanceType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public UUID getCreatedById() { return createdById; }
    public void setCreatedById(UUID createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public UUID getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(UUID assignedStaffId) { this.assignedStaffId = assignedStaffId; }

    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }

    public String getCompletionNote() { return completionNote; }
    public void setCompletionNote(String completionNote) { this.completionNote = completionNote; }

    public List<UUID> getDamageRecordIds() { return damageRecordIds; }
    public void setDamageRecordIds(List<UUID> damageRecordIds) { this.damageRecordIds = damageRecordIds; }

    public List<LinkedDamageDto> getDamageRecords() { return damageRecords; }
    public void setDamageRecords(List<LinkedDamageDto> damageRecords) { this.damageRecords = damageRecords; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public BigDecimal getApprovedWeight() { return approvedWeight; }
    public void setApprovedWeight(BigDecimal approvedWeight) { this.approvedWeight = approvedWeight; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
