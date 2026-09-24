package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OwnershipShareResponse(
        UUID id,
        UUID groupId,
        UUID vehicleId,
        UUID memberId,
        BigDecimal percentage,
        Instant updatedAt
) {}
