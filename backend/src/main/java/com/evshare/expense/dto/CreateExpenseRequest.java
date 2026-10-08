package com.evshare.expense.dto;

import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseSourceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class CreateExpenseRequest {

    @NotNull(message = "ID phương tiện không được để trống")
    private UUID vehicleId;

    @NotNull(message = "Loại chi phí không được để trống")
    private ExpenseCategory category;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1.00", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Nội dung chi phí không được để trống")
    @Size(max = 255, message = "Nội dung chi phí không được vượt quá 255 ký tự")
    private String description;

    @NotNull(message = "Thời gian phát sinh không được để trống")
    private Instant occurredAt;

    private UUID paidByUserId;

    private ExpenseSourceType sourceType = ExpenseSourceType.MANUAL;

    @Size(max = 100, message = "Mã tham chiếu nguồn không được vượt quá 100 ký tự")
    private String sourceReferenceId;

    @Size(max = 500, message = "Đường dẫn chứng từ không được vượt quá 500 ký tự")
    private String evidenceUrl;

    @Size(max = 500, message = "Ghi chú chứng từ không được vượt quá 500 ký tự")
    private String evidenceNote;

    private ExpenseAllocationPolicy allocationPolicy;

    private UUID responsibleUserId;

    private UUID relatedTripId;

    private UUID relatedBookingId;

    public CreateExpenseRequest() {
    }

    public CreateExpenseRequest(
            UUID vehicleId,
            ExpenseCategory category,
            BigDecimal amount,
            String description,
            Instant occurredAt,
            UUID paidByUserId,
            ExpenseSourceType sourceType,
            String sourceReferenceId
    ) {
        this(vehicleId, category, amount, description, occurredAt, paidByUserId, sourceType, sourceReferenceId, null, null);
    }

    public CreateExpenseRequest(
            UUID vehicleId,
            ExpenseCategory category,
            BigDecimal amount,
            String description,
            Instant occurredAt,
            UUID paidByUserId,
            ExpenseSourceType sourceType,
            String sourceReferenceId,
            String evidenceUrl,
            String evidenceNote
    ) {
        this.vehicleId = vehicleId;
        this.category = category;
        this.amount = amount;
        this.description = description;
        this.occurredAt = occurredAt;
        this.paidByUserId = paidByUserId;
        this.sourceType = sourceType != null ? sourceType : ExpenseSourceType.MANUAL;
        this.sourceReferenceId = sourceReferenceId;
        this.evidenceUrl = evidenceUrl;
        this.evidenceNote = evidenceNote;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(ExpenseCategory category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public UUID getPaidByUserId() {
        return paidByUserId;
    }

    public void setPaidByUserId(UUID paidByUserId) {
        this.paidByUserId = paidByUserId;
    }

    public ExpenseSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(ExpenseSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getSourceReferenceId() {
        return sourceReferenceId;
    }

    public void setSourceReferenceId(String sourceReferenceId) {
        this.sourceReferenceId = sourceReferenceId;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getEvidenceNote() {
        return evidenceNote;
    }

    public void setEvidenceNote(String evidenceNote) {
        this.evidenceNote = evidenceNote;
    }

    public ExpenseAllocationPolicy getAllocationPolicy() {
        return allocationPolicy;
    }

    public void setAllocationPolicy(ExpenseAllocationPolicy allocationPolicy) {
        this.allocationPolicy = allocationPolicy;
    }

    public UUID getResponsibleUserId() {
        return responsibleUserId;
    }

    public void setResponsibleUserId(UUID responsibleUserId) {
        this.responsibleUserId = responsibleUserId;
    }

    public UUID getRelatedTripId() {
        return relatedTripId;
    }

    public void setRelatedTripId(UUID relatedTripId) {
        this.relatedTripId = relatedTripId;
    }

    public UUID getRelatedBookingId() {
        return relatedBookingId;
    }

    public void setRelatedBookingId(UUID relatedBookingId) {
        this.relatedBookingId = relatedBookingId;
    }
}
