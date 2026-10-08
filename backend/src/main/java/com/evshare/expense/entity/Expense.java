package com.evshare.expense.entity;

import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "co_ownership_group_id", referencedColumnName = "id")
    private CoOwnershipGroup coOwnershipGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30, nullable = false)
    private ExpenseCategory category;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "description", length = 255, nullable = false)
    private String description;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_user_id", referencedColumnName = "id", nullable = false)
    private User paidBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", referencedColumnName = "id", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_policy", length = 30, nullable = false)
    private ExpenseAllocationPolicy allocationPolicy = ExpenseAllocationPolicy.OWNERSHIP_RATIO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_user_id", referencedColumnName = "id")
    private User responsibleUser;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "related_trip_id", length = 36)
    private UUID relatedTripId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "related_booking_id", length = 36)
    private UUID relatedBookingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 50)
    private ExpenseSourceType sourceType = ExpenseSourceType.MANUAL;

    @Column(name = "source_reference_id", length = 100)
    private String sourceReferenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ExpenseStatus status = ExpenseStatus.PENDING_VERIFICATION;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "evidence_note", length = 500)
    private String evidenceNote;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ExpenseShare> shares = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ExpenseApproval> approvals = new java.util.ArrayList<>();

    public Expense() {
    }

    public Expense(
            UUID id,
            Vehicle vehicle,
            CoOwnershipGroup coOwnershipGroup,
            ExpenseCategory category,
            BigDecimal amount,
            String description,
            Instant occurredAt,
            User paidBy,
            User createdBy,
            ExpenseSourceType sourceType,
            String sourceReferenceId
    ) {
        this(
                id,
                vehicle,
                coOwnershipGroup,
                category,
                amount,
                description,
                occurredAt,
                paidBy,
                createdBy,
                sourceType,
                sourceReferenceId,
                ExpenseStatus.PENDING_VERIFICATION,
                null,
                null
        );
    }

    public Expense(
            UUID id,
            Vehicle vehicle,
            CoOwnershipGroup coOwnershipGroup,
            ExpenseCategory category,
            BigDecimal amount,
            String description,
            Instant occurredAt,
            User paidBy,
            User createdBy,
            ExpenseSourceType sourceType,
            String sourceReferenceId,
            ExpenseStatus status,
            String evidenceUrl,
            String evidenceNote
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.coOwnershipGroup = coOwnershipGroup;
        this.category = category;
        this.amount = amount;
        this.description = description;
        this.occurredAt = occurredAt != null ? occurredAt : Instant.now();
        this.paidBy = paidBy;
        this.createdBy = createdBy;
        this.sourceType = sourceType != null ? sourceType : ExpenseSourceType.MANUAL;
        this.sourceReferenceId = sourceReferenceId;
        this.status = status != null ? status : ExpenseStatus.PENDING_VERIFICATION;
        this.evidenceUrl = evidenceUrl;
        this.evidenceNote = evidenceNote;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.occurredAt == null) {
            this.occurredAt = Instant.now();
        }
        if (this.sourceType == null) {
            this.sourceType = ExpenseSourceType.MANUAL;
        }
        if (this.status == null) {
            this.status = ExpenseStatus.PENDING_VERIFICATION;
        }
        if (this.allocationPolicy == null) {
            this.allocationPolicy = ExpenseAllocationPolicy.OWNERSHIP_RATIO;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public CoOwnershipGroup getCoOwnershipGroup() {
        return coOwnershipGroup;
    }

    public void setCoOwnershipGroup(CoOwnershipGroup coOwnershipGroup) {
        this.coOwnershipGroup = coOwnershipGroup;
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

    public User getPaidBy() {
        return paidBy;
    }

    public void setPaidBy(User paidBy) {
        this.paidBy = paidBy;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public java.util.List<ExpenseShare> getShares() {
        return shares;
    }

    public void setShares(java.util.List<ExpenseShare> shares) {
        this.shares = shares;
    }

    public ExpenseStatus getStatus() {
        return status;
    }

    public void setStatus(ExpenseStatus status) {
        this.status = status;
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

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Instant getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(Instant rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public java.util.List<ExpenseApproval> getApprovals() {
        return approvals;
    }

    public void setApprovals(java.util.List<ExpenseApproval> approvals) {
        this.approvals = approvals;
    }

    public ExpenseAllocationPolicy getAllocationPolicy() {
        return allocationPolicy;
    }

    public void setAllocationPolicy(ExpenseAllocationPolicy allocationPolicy) {
        this.allocationPolicy = allocationPolicy != null ? allocationPolicy : ExpenseAllocationPolicy.OWNERSHIP_RATIO;
    }

    public User getResponsibleUser() {
        return responsibleUser;
    }

    public void setResponsibleUser(User responsibleUser) {
        this.responsibleUser = responsibleUser;
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
