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
@Table(name = "expense_approvals", uniqueConstraints = {
        @UniqueConstraint(name = "uk_expense_approvals_expense_user", columnNames = {"expense_id", "user_id"})
})
public class ExpenseApproval {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", referencedColumnName = "id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", length = 20, nullable = false)
    private ExpenseApprovalDecision decision;

    @Column(name = "ownership_percentage_snapshot", precision = 7, scale = 4, nullable = false)
    private BigDecimal ownershipPercentageSnapshot;

    @Column(name = "comment", length = 500)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ExpenseApproval() {
    }

    public ExpenseApproval(
            UUID id,
            Expense expense,
            User user,
            ExpenseApprovalDecision decision,
            BigDecimal ownershipPercentageSnapshot,
            String comment
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.expense = expense;
        this.user = user;
        this.decision = decision;
        this.ownershipPercentageSnapshot = ownershipPercentageSnapshot;
        this.comment = comment;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
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

    public ExpenseApprovalDecision getDecision() {
        return decision;
    }

    public void setDecision(ExpenseApprovalDecision decision) {
        this.decision = decision;
    }

    public BigDecimal getOwnershipPercentageSnapshot() {
        return ownershipPercentageSnapshot;
    }

    public void setOwnershipPercentageSnapshot(BigDecimal ownershipPercentageSnapshot) {
        this.ownershipPercentageSnapshot = ownershipPercentageSnapshot;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
