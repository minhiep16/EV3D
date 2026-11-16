package com.evshare.dispute.dto;

public record RecipientAcknowledgeDemoPaymentRequest(
        Boolean confirmed,
        String note
) {}
