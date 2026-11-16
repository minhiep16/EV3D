package com.evshare.expense.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MemberCostShareResponse(
        UUID userId,
        String userName,
        BigDecimal ownershipPercentage,
        BigDecimal requiredShare,
        BigDecimal paidAmount,
        BigDecimal pendingVerificationAmount,
        BigDecimal outstandingAmount,
        BigDecimal netPosition,
        boolean isCurrentUser
) {
    public MemberCostShareResponse(
            UUID userId,
            String userName,
            BigDecimal ownershipPercentage,
            BigDecimal requiredShare,
            BigDecimal paidAmount,
            BigDecimal netPosition,
            boolean isCurrentUser
    ) {
        this(userId, userName, ownershipPercentage, requiredShare, paidAmount,
             BigDecimal.ZERO, BigDecimal.ZERO, netPosition, isCurrentUser);
    }
}
