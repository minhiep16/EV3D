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
        List<MemberCostShareResponse> memberBreakdown
) {
}
