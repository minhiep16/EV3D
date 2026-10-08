package com.evshare.expense.dto;

import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseSourceType;
import com.evshare.expense.entity.ExpenseStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID vehicleId,
        String vehicleName,
        UUID coOwnershipGroupId,
        ExpenseCategory category,
        String categoryLabel,
        BigDecimal amount,
        String description,
        Instant occurredAt,
        UUID paidByUserId,
        String paidByUserName,
        UUID createdByUserId,
        String createdByUserName,
        ExpenseSourceType sourceType,
        String sourceReferenceId,
        ExpenseStatus status,
        String statusLabel,
        String evidenceUrl,
        String evidenceNote,
        Instant approvedAt,
        Instant rejectedAt,
        Instant createdAt,
        ExpenseAllocationPolicy allocationPolicy,
        String allocationPolicyLabel,
        UUID responsibleUserId,
        String responsibleUserName,
        UUID relatedTripId,
        UUID relatedBookingId,
        Integer startBatteryLevel,
        Integer endBatteryLevel,
        BigDecimal energyConsumedKwh,
        Boolean isEstimatedEnergy,
        String verifiedByStaffName
) {
    public static ExpenseResponse fromEntity(Expense expense) {
        return fromEntity(expense, null);
    }

    public static ExpenseResponse fromEntity(Expense expense, com.evshare.trip.entity.Trip trip) {
        ExpenseStatus status = expense.getStatus() != null ? expense.getStatus() : ExpenseStatus.PENDING_VERIFICATION;
        ExpenseAllocationPolicy policy = expense.getAllocationPolicy() != null ? expense.getAllocationPolicy() : ExpenseAllocationPolicy.OWNERSHIP_RATIO;

        Integer startSoc = null;
        Integer endSoc = null;
        BigDecimal energyKwh = null;
        Boolean isEst = null;
        String staffName = null;

        if (trip != null) {
            startSoc = trip.getStartBatteryLevel();
            endSoc = trip.getEndBatteryLevel();
            energyKwh = trip.getEnergyConsumedKwh();
            isEst = (trip.getEnergyConsumedKwh() == null);
            staffName = trip.getReturnVerifiedBy() != null ? trip.getReturnVerifiedBy().getFullName() : null;
        }

        if (staffName == null && expense.getCreatedBy() != null) {
            staffName = expense.getCreatedBy().getFullName();
        }

        return new ExpenseResponse(
                expense.getId(),
                expense.getVehicle() != null ? expense.getVehicle().getId() : null,
                expense.getVehicle() != null ? expense.getVehicle().getName() : null,
                expense.getCoOwnershipGroup() != null ? expense.getCoOwnershipGroup().getId() : null,
                expense.getCategory(),
                expense.getCategory() != null ? expense.getCategory().getVietnameseLabel() : null,
                expense.getAmount(),
                expense.getDescription(),
                expense.getOccurredAt(),
                expense.getPaidBy() != null ? expense.getPaidBy().getId() : null,
                expense.getPaidBy() != null ? expense.getPaidBy().getFullName() : null,
                expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null,
                expense.getCreatedBy() != null ? expense.getCreatedBy().getFullName() : null,
                expense.getSourceType(),
                expense.getSourceReferenceId(),
                status,
                status.getVietnameseLabel(),
                expense.getEvidenceUrl(),
                expense.getEvidenceNote(),
                expense.getApprovedAt(),
                expense.getRejectedAt(),
                expense.getCreatedAt(),
                policy,
                policy.getVietnameseLabel(),
                expense.getResponsibleUser() != null ? expense.getResponsibleUser().getId() : null,
                expense.getResponsibleUser() != null ? expense.getResponsibleUser().getFullName() : null,
                expense.getRelatedTripId(),
                expense.getRelatedBookingId(),
                startSoc,
                endSoc,
                energyKwh,
                isEst,
                staffName
        );
    }
}
