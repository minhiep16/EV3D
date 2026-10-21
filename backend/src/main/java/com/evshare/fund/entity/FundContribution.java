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
@Table(name = "fund_contributions")
public class FundContribution {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id", referencedColumnName = "id", nullable = false)
    private SharedFund fund;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contributor_user_id", referencedColumnName = "id", nullable = false)
    private User contributorUser;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private FundContributionStatus status = FundContributionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "financial_mode", length = 20, nullable = false)
    private FinancialMode financialMode = FinancialMode.DEMO;

    @Column(name = "payment_method", length = 50, nullable = false)
    private String paymentMethod = "BANK_TRANSFER";

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id", referencedColumnName = "id")
    private User verifiedByUser;

    public FundContribution() {
    }

    public FundContribution(UUID id, SharedFund fund, User contributorUser, BigDecimal amount,
                            FundContributionStatus status, String paymentMethod, String paymentReference,
                            String evidenceUrl, String note) {
        this.id = id != null ? id : UUID.randomUUID();
        this.fund = fund;
        this.contributorUser = contributorUser;
        this.amount = amount;
        this.status = status != null ? status : FundContributionStatus.PENDING;
        this.financialMode = FinancialMode.DEMO;
        this.paymentMethod = paymentMethod != null ? paymentMethod : "BANK_TRANSFER";
        this.paymentReference = paymentReference;
        this.evidenceUrl = evidenceUrl;
        this.note = note;
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

    public User getContributorUser() {
        return contributorUser;
    }

    public void setContributorUser(User contributorUser) {
        this.contributorUser = contributorUser;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public FundContributionStatus getStatus() {
        return status;
    }

    public void setStatus(FundContributionStatus status) {
        this.status = status;
    }

    public FinancialMode getFinancialMode() {
        return financialMode;
    }

    public void setFinancialMode(FinancialMode financialMode) {
        this.financialMode = financialMode;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public User getVerifiedByUser() {
        return verifiedByUser;
    }

    public void setVerifiedByUser(User verifiedByUser) {
        this.verifiedByUser = verifiedByUser;
    }
}
