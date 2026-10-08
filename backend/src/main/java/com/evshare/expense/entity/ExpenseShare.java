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

    @Column(name = "allocation_percentage", precision = 7, scale = 4)
    private BigDecimal allocationPercentage;

    @Column(name = "share_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal shareAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ExpenseShareStatus status = ExpenseShareStatus.ALLOCATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_policy", length = 30)
    private ExpenseAllocationPolicy allocationPolicy;

    @Column(name = "member_km_snapshot", precision = 10, scale = 2)
    private BigDecimal memberKmSnapshot;

    @Column(name = "total_km_snapshot", precision = 10, scale = 2)
    private BigDecimal totalKmSnapshot;

    @Column(name = "raw_calculated_amount", precision = 14, scale = 2)
    private BigDecimal rawCalculatedAmount;

    @Column(name = "redistribution_adjustment", precision = 14, scale = 2)
    private BigDecimal redistributionAdjustment;

    @Column(name = "allocation_period_start")
    private Instant allocationPeriodStart;

    @Column(name = "allocation_period_end")
    private Instant allocationPeriodEnd;

    @Column(name = "calculation_version", length = 20)
    private String calculationVersion;

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
        if (this.allocationPercentage == null) {
            this.allocationPercentage = this.ownershipPercentage;
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

    public BigDecimal getAllocationPercentage() {
        return allocationPercentage != null ? allocationPercentage : ownershipPercentage;
    }

    public void setAllocationPercentage(BigDecimal allocationPercentage) {
        this.allocationPercentage = allocationPercentage;
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

    public ExpenseAllocationPolicy getAllocationPolicy() {
        return allocationPolicy;
    }

    public void setAllocationPolicy(ExpenseAllocationPolicy allocationPolicy) {
        this.allocationPolicy = allocationPolicy;
    }

    public BigDecimal getMemberKmSnapshot() {
        return memberKmSnapshot;
    }

    public void setMemberKmSnapshot(BigDecimal memberKmSnapshot) {
        this.memberKmSnapshot = memberKmSnapshot;
    }

    public BigDecimal getTotalKmSnapshot() {
        return totalKmSnapshot;
    }

    public void setTotalKmSnapshot(BigDecimal totalKmSnapshot) {
        this.totalKmSnapshot = totalKmSnapshot;
    }

    public BigDecimal getRawCalculatedAmount() {
        return rawCalculatedAmount;
    }

    public void setRawCalculatedAmount(BigDecimal rawCalculatedAmount) {
        this.rawCalculatedAmount = rawCalculatedAmount;
    }

    public BigDecimal getRedistributionAdjustment() {
        return redistributionAdjustment;
    }

    public void setRedistributionAdjustment(BigDecimal redistributionAdjustment) {
        this.redistributionAdjustment = redistributionAdjustment;
    }

    public Instant getAllocationPeriodStart() {
        return allocationPeriodStart;
    }

    public void setAllocationPeriodStart(Instant allocationPeriodStart) {
        this.allocationPeriodStart = allocationPeriodStart;
    }

    public Instant getAllocationPeriodEnd() {
        return allocationPeriodEnd;
    }

    public void setAllocationPeriodEnd(Instant allocationPeriodEnd) {
        this.allocationPeriodEnd = allocationPeriodEnd;
    }

    public String getCalculationVersion() {
        return calculationVersion;
    }

    public void setCalculationVersion(String calculationVersion) {
        this.calculationVersion = calculationVersion;
    }
}
