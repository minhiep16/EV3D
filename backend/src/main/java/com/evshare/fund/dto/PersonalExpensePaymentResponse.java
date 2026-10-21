package com.evshare.fund.dto;

import com.evshare.fund.entity.FinancialMode;
import com.evshare.fund.entity.PersonalPaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PersonalExpensePaymentResponse(
        UUID id,
        UUID expenseId,
        String expenseDescription,
        UUID expenseShareId,
        UUID payerUserId,
        String payerName,
        BigDecimal amount,
        PersonalPaymentStatus status,
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
        UUID vehicleId,
        String vehicleName
) {}
