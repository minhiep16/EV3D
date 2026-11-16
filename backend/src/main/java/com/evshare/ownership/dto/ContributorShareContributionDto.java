package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContributorShareContributionDto(
        UUID userId,
        String fullName,
        String email,
        BigDecimal percentage,
        Boolean consented,
        Boolean declined,
        Instant consentedAt,
        String note
) {
}
