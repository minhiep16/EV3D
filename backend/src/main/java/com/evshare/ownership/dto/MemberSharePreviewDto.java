package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MemberSharePreviewDto(
        UUID userId,
        String fullName,
        String email,
        BigDecimal currentPercentage,
        BigDecimal deductionPercentage,
        BigDecimal projectedPercentage,
        boolean isCurrentLeader,
        boolean isProjectedLeader,
        String roleLabel
) {
}
