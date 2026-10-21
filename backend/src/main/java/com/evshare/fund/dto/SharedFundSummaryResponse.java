package com.evshare.fund.dto;

import com.evshare.fund.entity.FinancialMode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SharedFundSummaryResponse(
        UUID fundId,
        UUID groupId,
        UUID vehicleId,
        String groupName,
        String currency,
        BigDecimal availableBalance,
        BigDecimal pendingContributionTotal,
        BigDecimal totalContributionsConfirmed,
        BigDecimal totalDisbursementsConfirmed,
        long contributionCount,
        long transactionCount,
        Instant lastUpdated,
        FinancialMode financialMode,
        String financialModeLabel
) {
    public UUID id() {
        return fundId;
    }

    public BigDecimal totalContributions() {
        return totalContributionsConfirmed;
    }
}
