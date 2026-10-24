package com.evshare.contract.dto;

import com.evshare.contract.entity.AcceptanceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractAcceptanceResponse(
        UUID id,
        UUID contractVersionId,
        UUID userId,
        String fullName,
        String email,
        BigDecimal ownershipPercentage,
        AcceptanceStatus status,
        String statusLabel,
        Instant acceptedAt,
        String contentHashAtAcceptance,
        String acceptanceMethod
) {
}
