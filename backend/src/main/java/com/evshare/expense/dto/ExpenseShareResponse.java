package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseShareResponse(
        UUID id,
        UUID expenseId,
        UUID userId,
        String userName,
        BigDecimal ownershipPercentage,
        BigDecimal shareAmount,
        ExpenseShareStatus status,
        boolean isPayer,
        BigDecimal paidAmount
) {
    public static ExpenseShareResponse fromEntity(ExpenseShare share, boolean isPayer, BigDecimal paidAmount) {
        return new ExpenseShareResponse(
                share.getId(),
                share.getExpense() != null ? share.getExpense().getId() : null,
                share.getUser() != null ? share.getUser().getId() : null,
                share.getUser() != null ? share.getUser().getFullName() : "Không xác định",
                share.getOwnershipPercentage(),
                share.getShareAmount(),
                share.getStatus(),
                isPayer,
                paidAmount != null ? paidAmount : BigDecimal.ZERO
        );
    }
}
