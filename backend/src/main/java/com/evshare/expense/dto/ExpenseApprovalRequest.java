package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseApprovalDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ExpenseApprovalRequest(
        @NotNull(message = "Quyết định không được để trống")
        ExpenseApprovalDecision decision,
        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String comment,
        ExpenseAllocationPolicy allocationPolicy,
        UUID responsibleUserId
) {
    public ExpenseApprovalRequest(ExpenseApprovalDecision decision, String comment) {
        this(decision, comment, null, null);
    }
}
