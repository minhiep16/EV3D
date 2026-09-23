package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CoOwnershipGroupResponse(
        UUID id,
        UUID vehicleId,
        String name,
        Instant createdAt,
        List<GroupMemberResponse> members,
        BigDecimal totalOwnershipPercentage,
        BigDecimal availablePercentage
) {}
