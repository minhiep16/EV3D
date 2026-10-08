package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseAllocationPolicy;
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
        BigDecimal allocationPercentage,
        BigDecimal shareAmount,
        ExpenseShareStatus status,
        boolean isPayer,
        BigDecimal paidAmount,
        ExpenseAllocationPolicy allocationPolicy,
        String allocationPolicyLabel,
        boolean isResponsibleUser,
        BigDecimal memberKmSnapshot,
        BigDecimal totalKmSnapshot,
        BigDecimal rawCalculatedAmount,
        BigDecimal redistributionAdjustment,
        java.time.Instant allocationPeriodStart,
        java.time.Instant allocationPeriodEnd,
        String calculationVersion
) {
    public static ExpenseShareResponse fromEntity(ExpenseShare share, boolean isPayer, BigDecimal paidAmount) {
        ExpenseAllocationPolicy policy = share.getAllocationPolicy() != null
                ? share.getAllocationPolicy()
                : (share.getExpense() != null && share.getExpense().getAllocationPolicy() != null
                    ? share.getExpense().getAllocationPolicy()
                    : ExpenseAllocationPolicy.OWNERSHIP_RATIO);
        boolean isResp = share.getExpense() != null
                && share.getExpense().getResponsibleUser() != null
                && share.getUser() != null
                && share.getExpense().getResponsibleUser().getId().equals(share.getUser().getId());

        BigDecimal allocPct = share.getAllocationPercentage() != null
                ? share.getAllocationPercentage()
                : share.getOwnershipPercentage();

        return new ExpenseShareResponse(
                share.getId(),
                share.getExpense() != null ? share.getExpense().getId() : null,
                share.getUser() != null ? share.getUser().getId() : null,
                share.getUser() != null ? share.getUser().getFullName() : "Không xác định",
                share.getOwnershipPercentage(),
                allocPct,
                share.getShareAmount(),
                share.getStatus(),
                isPayer,
                paidAmount != null ? paidAmount : BigDecimal.ZERO,
                policy,
                policy.getVietnameseLabel(),
                isResp,
                share.getMemberKmSnapshot(),
                share.getTotalKmSnapshot(),
                share.getRawCalculatedAmount(),
                share.getRedistributionAdjustment(),
                share.getAllocationPeriodStart(),
                share.getAllocationPeriodEnd(),
                share.getCalculationVersion()
        );
    }
}
