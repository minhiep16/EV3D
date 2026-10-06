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
    @Column(name = "source_type", length = 50)
    private ExpenseSourceType sourceType = ExpenseSourceType.MANUAL;

    @Column(name = "source_reference_id", length = 100)
    private String sourceReferenceId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ExpenseShare> shares = new java.util.ArrayList<>();

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
}
