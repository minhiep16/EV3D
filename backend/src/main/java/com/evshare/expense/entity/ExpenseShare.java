package com.evshare.expense.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expense_shares", uniqueConstraints = {
        @UniqueConstraint(name = "uk_expense_shares_expense_user", columnNames = {"expense_id", "user_id"})
})
public class ExpenseShare {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", referencedColumnName = "id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "ownership_percentage", precision = 7, scale = 4, nullable = false)
    private BigDecimal ownershipPercentage;

    @Column(name = "share_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal shareAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ExpenseShareStatus status = ExpenseShareStatus.ALLOCATED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ExpenseShare() {
    }

    public ExpenseShare(
            UUID id,
            Expense expense,
            User user,
            BigDecimal ownershipPercentage,
            BigDecimal shareAmount,
            ExpenseShareStatus status
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.expense = expense;
        this.user = user;
        this.ownershipPercentage = ownershipPercentage;
        this.shareAmount = shareAmount;
        this.status = status != null ? status : ExpenseShareStatus.ALLOCATED;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = ExpenseShareStatus.ALLOCATED;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Expense getExpense() {
        return expense;
    }

    public void setExpense(Expense expense) {
        this.expense = expense;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BigDecimal getOwnershipPercentage() {
        return ownershipPercentage;
    }

    public void setOwnershipPercentage(BigDecimal ownershipPercentage) {
        this.ownershipPercentage = ownershipPercentage;
    }

    public BigDecimal getShareAmount() {
        return shareAmount;
    }

    public void setShareAmount(BigDecimal shareAmount) {
        this.shareAmount = shareAmount;
    }

    public ExpenseShareStatus getStatus() {
        return status;
    }

    public void setStatus(ExpenseShareStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
