package com.evshare.admin.dto;

import com.evshare.user.entity.Role;
import com.evshare.user.entity.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String fullName,
        Role role,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt,
        int activeGroupsCount,
        List<String> activeVehicleNames,
        boolean hasActiveTrip,
        boolean hasActiveBooking
) {
}
