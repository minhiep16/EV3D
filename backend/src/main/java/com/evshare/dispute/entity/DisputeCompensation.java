package com.evshare.dispute.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dispute_compensations")
public class DisputeCompensation implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_user_id")
    private User payerUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "payer_type", length = 40, nullable = false)
    private PayerType payerType = PayerType.PREVIOUS_CO_OWNER;

    @Column(name = "payer_name", length = 255, nullable = false)
    private String payerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipientUser;

    @Column(name = "recipient_name", length = 255, nullable = false)
    private String recipientName;

    @Column(name = "approved_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal approvedAmount;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "VND";

    @Column(name = "verified_paid_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal verifiedPaidAmount = BigDecimal.ZERO;

    @Column(name = "outstanding_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal outstandingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private CompensationStatus status = CompensationStatus.AWAITING_PAYMENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorized_by_user_id", nullable = false)
    private User authorizedBy;

    @Column(name = "authorized_at", nullable = false)
    private Instant authorizedAt;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "decision_basis", columnDefinition = "TEXT")
    private String decisionBasis;

    @Column(name = "pending_payment_amount", precision = 14, scale = 2)
    private BigDecimal pendingPaymentAmount;

    @Column(name = "pending_payment_reference", length = 100)
    private String pendingPaymentReference;

    @Column(name = "pending_receipt_url", length = 500)
    private String pendingReceiptUrl;

    @Column(name = "pending_payment_date")
    private Instant pendingPaymentDate;

    @Column(name = "pending_payment_note", columnDefinition = "TEXT")
    private String pendingPaymentNote;

    @Column(name = "pending_submitted_at")
    private Instant pendingSubmittedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @OneToMany(mappedBy = "compensation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<DisputeCompensationPayment> payments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public DisputeCompensation() {
    }

    public DisputeCompensation(
            UUID id,
            Dispute dispute,
            User payerUser,
            PayerType payerType,
            String payerName,
            User recipientUser,
            String recipientName,
            BigDecimal approvedAmount,
            User authorizedBy,
            String decisionBasis
    ) {
        this.id = id;
        this.dispute = dispute;
        this.payerUser = payerUser;
        this.payerType = payerType != null ? payerType : PayerType.PREVIOUS_CO_OWNER;
        this.payerName = payerName;
        this.recipientUser = recipientUser;
        this.recipientName = recipientName;
        this.approvedAmount = approvedAmount;
        this.currency = "VND";
        this.verifiedPaidAmount = BigDecimal.ZERO;
        this.outstandingAmount = approvedAmount;
        this.status = CompensationStatus.AWAITING_PAYMENT;
        this.authorizedBy = authorizedBy;
        this.authorizedAt = Instant.now();
        this.decisionBasis = decisionBasis;
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

    public Dispute getDispute() {
        return dispute;
    }

    public void setDispute(Dispute dispute) {
        this.dispute = dispute;
    }

    public User getPayerUser() {
        return payerUser;
    }

    public void setPayerUser(User payerUser) {
        this.payerUser = payerUser;
    }

    public PayerType getPayerType() {
        return payerType;
    }

    public void setPayerType(PayerType payerType) {
        this.payerType = payerType;
    }

    public String getPayerName() {
        return payerName;
    }

    public void setPayerName(String payerName) {
        this.payerName = payerName;
    }

    public User getRecipientUser() {
        return recipientUser;
    }

    public void setRecipientUser(User recipientUser) {
        this.recipientUser = recipientUser;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getVerifiedPaidAmount() {
        return verifiedPaidAmount;
    }

    public void setVerifiedPaidAmount(BigDecimal verifiedPaidAmount) {
        this.verifiedPaidAmount = verifiedPaidAmount;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public CompensationStatus getStatus() {
        return status;
    }

    public void setStatus(CompensationStatus status) {
        this.status = status;
    }

    public User getAuthorizedBy() {
        return authorizedBy;
    }

    public void setAuthorizedBy(User authorizedBy) {
        this.authorizedBy = authorizedBy;
    }

    public Instant getAuthorizedAt() {
        return authorizedAt;
    }

    public void setAuthorizedAt(Instant authorizedAt) {
        this.authorizedAt = authorizedAt;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getDecisionBasis() {
        return decisionBasis;
    }

    public void setDecisionBasis(String decisionBasis) {
        this.decisionBasis = decisionBasis;
    }

    public List<DisputeCompensationPayment> getPayments() {
        return payments;
    }

    public void setPayments(List<DisputeCompensationPayment> payments) {
        this.payments = payments;
    }

    public BigDecimal getPendingPaymentAmount() {
        return pendingPaymentAmount;
    }

    public void setPendingPaymentAmount(BigDecimal pendingPaymentAmount) {
        this.pendingPaymentAmount = pendingPaymentAmount;
    }

    public String getPendingPaymentReference() {
        return pendingPaymentReference;
    }

    public void setPendingPaymentReference(String pendingPaymentReference) {
        this.pendingPaymentReference = pendingPaymentReference;
    }

    public String getPendingReceiptUrl() {
        return pendingReceiptUrl;
    }

    public void setPendingReceiptUrl(String pendingReceiptUrl) {
        this.pendingReceiptUrl = pendingReceiptUrl;
    }

    public Instant getPendingPaymentDate() {
        return pendingPaymentDate;
    }

    public void setPendingPaymentDate(Instant pendingPaymentDate) {
        this.pendingPaymentDate = pendingPaymentDate;
    }

    public String getPendingPaymentNote() {
        return pendingPaymentNote;
    }

    public void setPendingPaymentNote(String pendingPaymentNote) {
        this.pendingPaymentNote = pendingPaymentNote;
    }

    public Instant getPendingSubmittedAt() {
        return pendingSubmittedAt;
    }

    public void setPendingSubmittedAt(Instant pendingSubmittedAt) {
        this.pendingSubmittedAt = pendingSubmittedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
