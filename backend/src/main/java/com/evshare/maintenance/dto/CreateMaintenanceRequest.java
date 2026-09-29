package com.evshare.maintenance.dto;

import com.evshare.maintenance.entity.MaintenancePriority;
import com.evshare.maintenance.entity.MaintenanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CreateMaintenanceRequest {

    @NotBlank(message = "Tiêu đề yêu cầu bảo dưỡng không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    private String title;

    @NotNull(message = "Loại bảo dưỡng không được để trống")
    private MaintenanceType maintenanceType = MaintenanceType.PREVENTIVE;

    @NotNull(message = "Mức độ ưu tiên không được để trống")
    private MaintenancePriority priority = MaintenancePriority.MEDIUM;

    private String description;

    private Instant scheduledAt;

    private UUID assignedStaffId;

    private List<UUID> damageRecordIds;

    public CreateMaintenanceRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public MaintenanceType getMaintenanceType() {
        return maintenanceType;
    }

    public void setMaintenanceType(MaintenanceType maintenanceType) {
        this.maintenanceType = maintenanceType;
    }

    public MaintenancePriority getPriority() {
        return priority;
    }

    public void setPriority(MaintenancePriority priority) {
        this.priority = priority;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public UUID getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(UUID assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public List<UUID> getDamageRecordIds() {
        return damageRecordIds;
    }

    public void setDamageRecordIds(List<UUID> damageRecordIds) {
        this.damageRecordIds = damageRecordIds;
    }
}
