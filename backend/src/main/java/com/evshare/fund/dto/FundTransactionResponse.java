package com.evshare.fund.dto;

import com.evshare.fund.entity.FinancialMode;
import com.evshare.fund.entity.FundTransactionDirection;
import com.evshare.fund.entity.FundTransactionStatus;
import com.evshare.fund.entity.FundTransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FundTransactionResponse(
        UUID id,
        UUID fundId,
        FundTransactionType transactionType,
        String transactionTypeLabel,
        BigDecimal amount,
        FundTransactionDirection direction,
        FundTransactionStatus status,
        String referenceType,
        String referenceId,
        BigDecimal balanceAfter,
        String description,
        Instant createdAt,
        Instant confirmedAt,
        String confirmedByName,
        FinancialMode financialMode,
        String financialModeLabel
) {}
