package com.evshare.fund.entity;

import com.evshare.ownership.entity.CoOwnershipGroup;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shared_funds")
public class SharedFund {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", referencedColumnName = "id", nullable = false, unique = true)
    private CoOwnershipGroup group;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "VND";

    @Column(name = "available_balance", precision = 14, scale = 2, nullable = false)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "financial_mode", length = 20, nullable = false)
    private FinancialMode financialMode = FinancialMode.DEMO;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public SharedFund() {
    }

    public SharedFund(UUID id, CoOwnershipGroup group, String currency, BigDecimal availableBalance) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.currency = currency != null ? currency : "VND";
        this.availableBalance = availableBalance != null ? availableBalance : BigDecimal.ZERO;
        this.financialMode = FinancialMode.DEMO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(BigDecimal availableBalance) {
        this.availableBalance = availableBalance;
    }

    public FinancialMode getFinancialMode() {
        return financialMode;
    }

    public void setFinancialMode(FinancialMode financialMode) {
        this.financialMode = financialMode;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
