package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeCompensationPayment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DisputeCompensationPaymentDto(
        UUID id,
        UUID compensationId,
        BigDecimal amount,
        String paymentReference,
        String receiptUrl,
        Instant paymentDate,
        UUID verifiedByUserId,
        String verifiedByName,
        String note,
        Instant createdAt
) {
    public static DisputeCompensationPaymentDto fromEntity(DisputeCompensationPayment payment) {
        if (payment == null) return null;
        return new DisputeCompensationPaymentDto(
                payment.getId(),
                payment.getCompensation() != null ? payment.getCompensation().getId() : null,
                payment.getAmount(),
                payment.getPaymentReference(),
                payment.getReceiptUrl(),
                payment.getPaymentDate(),
                payment.getVerifiedByUser() != null ? payment.getVerifiedByUser().getId() : null,
                payment.getVerifiedByName(),
                payment.getNote(),
                payment.getCreatedAt()
        );
    }
}
