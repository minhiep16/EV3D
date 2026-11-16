package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        String calculationVersion,
        BigDecimal pendingVerificationAmount,
        BigDecimal remainingAmount,
        BigDecimal inverseOwnershipWeight,
        BigDecimal totalInverseOwnershipWeight,
        BigDecimal ownershipCost,
        BigDecimal usageCost,
        BigDecimal alphaWeight,
        BigDecimal betaWeight
) {
    public static ExpenseShareResponse fromEntity(
            ExpenseShare share,
            boolean isPayer,
            BigDecimal paidAmount,
            BigDecimal pendingVerificationAmount,
            BigDecimal remainingAmount,
            BigDecimal totalInverseWeightOverride
    ) {
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

        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        BigDecimal pending = pendingVerificationAmount != null ? pendingVerificationAmount : BigDecimal.ZERO;
        BigDecimal rem = remainingAmount != null
                ? remainingAmount
                : share.getShareAmount().subtract(paid).max(BigDecimal.ZERO);

        BigDecimal inverseWeight = null;
        BigDecimal totalInverseWeight = totalInverseWeightOverride;
        BigDecimal ownershipCost = null;
        BigDecimal usageCost = null;
        BigDecimal alpha = null;
        BigDecimal beta = null;

        if (policy == ExpenseAllocationPolicy.USAGE_AND_CAPITAL) {
            BigDecimal ownPct = share.getOwnershipPercentage() != null ? share.getOwnershipPercentage() : BigDecimal.ZERO;
            BigDecimal decOwn = ownPct.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
            inverseWeight = BigDecimal.ONE.subtract(decOwn).max(BigDecimal.ZERO).setScale(4, RoundingMode.HALF_UP);

            BigDecimal totKm = share.getTotalKmSnapshot() != null ? share.getTotalKmSnapshot() : BigDecimal.ZERO;
            boolean isZeroKm = totKm.compareTo(BigDecimal.ZERO) <= 0;
            alpha = isZeroKm ? BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP) : new BigDecimal("0.50");
            beta = isZeroKm ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : new BigDecimal("0.50");

            if (share.getExpense() != null && share.getExpense().getAmount() != null) {
                BigDecimal expAmt = share.getExpense().getAmount();
                BigDecimal memKm = share.getMemberKmSnapshot() != null ? share.getMemberKmSnapshot() : BigDecimal.ZERO;
                if (!isZeroKm && totKm.compareTo(BigDecimal.ZERO) > 0) {
                    usageCost = expAmt.multiply(beta).multiply(memKm).divide(totKm, 2, RoundingMode.HALF_UP);
                } else {
                    usageCost = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                }

                if (totalInverseWeight != null && totalInverseWeight.compareTo(BigDecimal.ZERO) > 0) {
                    ownershipCost = expAmt.multiply(alpha).multiply(inverseWeight).divide(totalInverseWeight, 2, RoundingMode.HALF_UP);
                } else if (share.getRawCalculatedAmount() != null) {
                    ownershipCost = share.getRawCalculatedAmount().subtract(usageCost).setScale(2, RoundingMode.HALF_UP);
                }
            }
        }

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
                paid,
                policy,
                policy.getVietnameseLabel(),
                isResp,
                share.getMemberKmSnapshot(),
                share.getTotalKmSnapshot(),
                share.getRawCalculatedAmount(),
                share.getRedistributionAdjustment(),
                share.getAllocationPeriodStart(),
                share.getAllocationPeriodEnd(),
                share.getCalculationVersion(),
                pending,
                rem,
                inverseWeight,
                totalInverseWeight,
                ownershipCost,
                usageCost,
                alpha,
                beta
        );
    }

    public static ExpenseShareResponse fromEntity(
            ExpenseShare share,
            boolean isPayer,
            BigDecimal paidAmount,
            BigDecimal pendingVerificationAmount,
            BigDecimal remainingAmount
    ) {
        return fromEntity(share, isPayer, paidAmount, pendingVerificationAmount, remainingAmount, null);
    }

    public static ExpenseShareResponse fromEntity(ExpenseShare share, boolean isPayer, BigDecimal paidAmount) {
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        BigDecimal rem = share.getShareAmount().subtract(paid).max(BigDecimal.ZERO);
        return fromEntity(share, isPayer, paid, BigDecimal.ZERO, rem, null);
    }
}
