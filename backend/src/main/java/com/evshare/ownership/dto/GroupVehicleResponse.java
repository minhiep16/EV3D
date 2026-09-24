package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupVehicleStatus;

import java.time.Instant;
import java.util.UUID;

public record GroupVehicleResponse(
        UUID id,
        UUID groupId,
        UUID vehicleId,
        String vehicleCode,
        String model,
        GroupVehicleStatus status,
        Instant addedAt
) {}
