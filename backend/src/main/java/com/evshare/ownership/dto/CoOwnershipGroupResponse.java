package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CoOwnershipGroupResponse(
        UUID id,
        String name,
        GroupStatus status,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt,
        List<GroupMemberResponse> members,
        List<GroupVehicleResponse> vehicles,
        UUID vehicleId,
        String vehicleCode,
        BigDecimal totalOwnershipPercentage,
        BigDecimal availablePercentage,
        String statusLabel
) {}
