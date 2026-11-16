package com.evshare.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AdminFinancialOverviewResponse(
        BigDecimal totalRecordedExpenses,
        BigDecimal verifiedPayments,
        BigDecimal outstandingObligations,
        long paymentsAwaitingVerificationCount,
        Map<String, BigDecimal> expensesByCategory,
        Map<String, BigDecimal> expensesByVehicle
) {
}
