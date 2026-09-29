package com.evshare.maintenance.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public class ScheduleMaintenanceRequest {

    @NotNull(message = "Thời gian lên lịch không được để trống")
    private Instant scheduledAt;

    private UUID assignedStaffId;

    public ScheduleMaintenanceRequest() {
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
}
