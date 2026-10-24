package com.evshare.contract.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractSignatoryResponse(
        UUID userId,
        String fullName,
        String email,
        String role,
        String roleVi,
        BigDecimal ownershipPercentage,
        boolean isConsented,
        Instant consentedAt,
        String statusVi
) {
}
