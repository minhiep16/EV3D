package com.evshare.fund.dto;

import com.evshare.fund.entity.FinancialMode;
import com.evshare.fund.entity.FundContributionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FundContributionResponse(
        UUID id,
        UUID fundId,
        UUID contributorUserId,
        String contributorName,
        BigDecimal amount,
        FundContributionStatus status,
        String statusLabel,
        String paymentMethod,
        String paymentReference,
        String evidenceUrl,
        String note,
        Instant createdAt,
        Instant verifiedAt,
        String verifiedByName,
        FinancialMode financialMode,
        String financialModeLabel,
        UUID groupId,
        String groupName
) {}
