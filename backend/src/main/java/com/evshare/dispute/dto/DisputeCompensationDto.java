package com.evshare.dispute.dto;

import com.evshare.dispute.entity.CompensationStatus;
import com.evshare.dispute.entity.DisputeCompensation;
import com.evshare.dispute.entity.PayerType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record DisputeCompensationDto(
        UUID id,
        UUID disputeId,
        UUID payerUserId,
        PayerType payerType,
        String payerName,
        UUID recipientUserId,
        String recipientName,
        BigDecimal approvedAmount,
        String currency,
        BigDecimal verifiedPaidAmount,
        BigDecimal outstandingAmount,
        CompensationStatus status,
        UUID authorizedByUserId,
        String authorizedByName,
        Instant authorizedAt,
        String paymentReference,
        String decisionBasis,
        List<DisputeCompensationPaymentDto> payments,
        BigDecimal pendingPaymentAmount,
        String pendingPaymentReference,
        String pendingReceiptUrl,
        Instant pendingPaymentDate,
        String pendingPaymentNote,
        Instant pendingSubmittedAt,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {
    public static DisputeCompensationDto fromEntity(DisputeCompensation compensation) {
        if (compensation == null) return null;
        List<DisputeCompensationPaymentDto> paymentDtos = compensation.getPayments() != null
                ? compensation.getPayments().stream().map(DisputeCompensationPaymentDto::fromEntity).collect(Collectors.toList())
                : List.of();

        return new DisputeCompensationDto(
                compensation.getId(),
                compensation.getDispute() != null ? compensation.getDispute().getId() : null,
                compensation.getPayerUser() != null ? compensation.getPayerUser().getId() : null,
                compensation.getPayerType(),
                compensation.getPayerName(),
                compensation.getRecipientUser() != null ? compensation.getRecipientUser().getId() : null,
                compensation.getRecipientName(),
                compensation.getApprovedAmount(),
                compensation.getCurrency(),
                compensation.getVerifiedPaidAmount(),
                compensation.getOutstandingAmount(),
                compensation.getStatus(),
                compensation.getAuthorizedBy() != null ? compensation.getAuthorizedBy().getId() : null,
                compensation.getAuthorizedBy() != null ? compensation.getAuthorizedBy().getFullName() : null,
                compensation.getAuthorizedAt(),
                compensation.getPaymentReference(),
                compensation.getDecisionBasis(),
                paymentDtos,
                compensation.getPendingPaymentAmount(),
                compensation.getPendingPaymentReference(),
                compensation.getPendingReceiptUrl(),
                compensation.getPendingPaymentDate(),
                compensation.getPendingPaymentNote(),
                compensation.getPendingSubmittedAt(),
                compensation.getRejectionReason(),
                compensation.getCreatedAt(),
                compensation.getUpdatedAt()
        );
    }
}
