package com.evshare.dispute.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dispute_compensation_payments")
public class DisputeCompensationPayment implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compensation_id", nullable = false)
    private DisputeCompensation compensation;

    @Column(name = "amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_reference", length = 100, nullable = false)
    private String paymentReference;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "payment_date", nullable = false)
    private Instant paymentDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id", nullable = false)
    private User verifiedByUser;

    @Column(name = "verified_by_name", length = 100)
    private String verifiedByName;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    public DisputeCompensationPayment() {
    }

    public DisputeCompensationPayment(
            UUID id,
            DisputeCompensation compensation,
            BigDecimal amount,
            String paymentReference,
            String receiptUrl,
            Instant paymentDate,
            User verifiedByUser,
            String verifiedByName,
            String note
    ) {
        this.id = id;
        this.compensation = compensation;
        this.amount = amount;
        this.paymentReference = paymentReference;
        this.receiptUrl = receiptUrl;
        this.paymentDate = paymentDate != null ? paymentDate : Instant.now();
        this.verifiedByUser = verifiedByUser;
        this.verifiedByName = verifiedByName;
        this.note = note;
        this.isNew = true;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public DisputeCompensation getCompensation() {
        return compensation;
    }

    public void setCompensation(DisputeCompensation compensation) {
        this.compensation = compensation;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getReceiptUrl() {
        return receiptUrl;
    }

    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }

    public Instant getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(Instant paymentDate) {
        this.paymentDate = paymentDate;
    }

    public User getVerifiedByUser() {
        return verifiedByUser;
    }

    public void setVerifiedByUser(User verifiedByUser) {
        this.verifiedByUser = verifiedByUser;
    }

    public String getVerifiedByName() {
        return verifiedByName;
    }

    public void setVerifiedByName(String verifiedByName) {
        this.verifiedByName = verifiedByName;
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
}
