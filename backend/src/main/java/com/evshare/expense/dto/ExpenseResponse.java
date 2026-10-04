package com.evshare.expense.dto;

import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseSourceType;

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
        Instant createdAt
) {
    public static ExpenseResponse fromEntity(Expense expense) {
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
                expense.getCreatedAt()
        );
    }
}
