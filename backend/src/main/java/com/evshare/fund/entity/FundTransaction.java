package com.evshare.fund.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fund_transactions")
public class FundTransaction {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id", referencedColumnName = "id", nullable = false)
    private SharedFund fund;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 40, nullable = false)
    private FundTransactionType transactionType;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", length = 20, nullable = false)
    private FundTransactionDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private FundTransactionStatus status = FundTransactionStatus.CONFIRMED;

    @Enumerated(EnumType.STRING)
    @Column(name = "financial_mode", length = 20, nullable = false)
    private FinancialMode financialMode = FinancialMode.DEMO;

    @Column(name = "reference_type", length = 40, nullable = false)
    private String referenceType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "balance_after", precision = 14, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "description", length = 500, nullable = false)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id", referencedColumnName = "id")
    private User confirmedByUser;

    public FundTransaction() {
    }

    public FundTransaction(UUID id, SharedFund fund, FundTransactionType transactionType, BigDecimal amount,
                           FundTransactionDirection direction, FundTransactionStatus status, String referenceType,
                           String referenceId, BigDecimal balanceAfter, String description,
                           Instant confirmedAt, User confirmedByUser) {
        this.id = id != null ? id : UUID.randomUUID();
        this.fund = fund;
        this.transactionType = transactionType;
        this.amount = amount;
        this.direction = direction;
        this.status = status != null ? status : FundTransactionStatus.CONFIRMED;
        this.financialMode = FinancialMode.DEMO;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.confirmedAt = confirmedAt;
        this.confirmedByUser = confirmedByUser;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public SharedFund getFund() {
        return fund;
    }

    public void setFund(SharedFund fund) {
        this.fund = fund;
    }

    public FundTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(FundTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public FundTransactionDirection getDirection() {
        return direction;
    }

    public void setDirection(FundTransactionDirection direction) {
        this.direction = direction;
    }

    public FundTransactionStatus getStatus() {
        return status;
    }

    public void setStatus(FundTransactionStatus status) {
        this.status = status;
    }

    public FinancialMode getFinancialMode() {
        return financialMode;
    }

    public void setFinancialMode(FinancialMode financialMode) {
        this.financialMode = financialMode;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(BigDecimal balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public User getConfirmedByUser() {
        return confirmedByUser;
    }

    public void setConfirmedByUser(User confirmedByUser) {
        this.confirmedByUser = confirmedByUser;
    }
}
