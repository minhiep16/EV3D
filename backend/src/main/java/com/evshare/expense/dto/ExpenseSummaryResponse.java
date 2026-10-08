package com.evshare.expense.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ExpenseSummaryResponse(
        String month,
        BigDecimal totalExpense,
        long transactionCount,
        Map<String, BigDecimal> categoryBreakdown,
        long pendingCount,
        BigDecimal pendingAmount
) {
    public ExpenseSummaryResponse(
            String month,
            BigDecimal totalExpense,
            long transactionCount,
            Map<String, BigDecimal> categoryBreakdown
    ) {
        this(month, totalExpense, transactionCount, categoryBreakdown, 0, BigDecimal.ZERO);
    }
}
