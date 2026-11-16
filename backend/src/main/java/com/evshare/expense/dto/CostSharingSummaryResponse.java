package com.evshare.expense.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CostSharingSummaryResponse(
        UUID vehicleId,
        String month,
        BigDecimal totalExpense,
        UUID userId,
        BigDecimal userOwnershipPercentage,
        BigDecimal userRequiredShare,
        BigDecimal userPaidAmount,
        BigDecimal userNetPosition,
        BigDecimal userPendingVerificationAmount,
        BigDecimal userOutstandingAmount,
        List<MemberCostShareResponse> memberBreakdown
) {
    public CostSharingSummaryResponse(
            UUID vehicleId,
            String month,
            BigDecimal totalExpense,
            UUID userId,
            BigDecimal userOwnershipPercentage,
            BigDecimal userRequiredShare,
            BigDecimal userPaidAmount,
            BigDecimal userNetPosition,
            List<MemberCostShareResponse> memberBreakdown
    ) {
        this(vehicleId, month, totalExpense, userId, userOwnershipPercentage,
             userRequiredShare, userPaidAmount, userNetPosition,
             BigDecimal.ZERO, BigDecimal.ZERO, memberBreakdown);
    }

    public BigDecimal getUserOwnershipPercentage() {
        return userOwnershipPercentage;
    }

    public BigDecimal getUserTotalDue() {
        return userRequiredShare;
    }

    public BigDecimal getUserVerifiedPaid() {
        return userPaidAmount;
    }

    public BigDecimal getUserOutstandingAmount() {
        return userOutstandingAmount != null ? userOutstandingAmount : BigDecimal.ZERO;
    }
}
