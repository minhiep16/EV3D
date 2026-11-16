package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InvitationSignatoryResponse(
        UUID userId,
        String fullName,
        String email,
        String role,
        String roleLabel,
        BigDecimal contributionPercentage,
        boolean signed,
        String signedAt,
        String signatureMethod,
        String ipAddress
) {
}
