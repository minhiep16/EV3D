package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseApprovalDecision;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MemberApprovalDecisionResponse(
        UUID userId,
        String userName,
        BigDecimal ownershipPercentage,
        boolean isCreator,
        ExpenseApprovalDecision decision,
        String comment,
        Instant decidedAt
) {
}
