package com.evshare.onboarding.dto;

import java.time.Instant;
import java.util.UUID;

public record DiscoverableGroupResponse(
        UUID groupId,
        String groupName,
        UUID vehicleId,
        String vehicleName,
        String vehicleModel,
        int openSlots,
        String publicTerms,
        String joinConditions,
        boolean isDiscoverable,
        String joinStatus, // "NONE", "PENDING", "APPROVED", "MEMBER"
        int totalMembers,
        Instant createdAt
) {}

