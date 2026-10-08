package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseApprovalDecision;
import com.evshare.expense.entity.ExpenseStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ExpenseApprovalStatusResponse(
        UUID expenseId,
        ExpenseStatus status,
        String statusLabel,
        UUID createdByUserId,
        String createdByUserName,
        BigDecimal approvalOwnershipPercentage,
        BigDecimal rejectionOwnershipPercentage,
        BigDecimal requiredThresholdPercentage,
        boolean isCreator,
        boolean canApprove,
        ExpenseApprovalDecision currentUserDecision,
        List<MemberApprovalDecisionResponse> memberDecisions
) {
}
