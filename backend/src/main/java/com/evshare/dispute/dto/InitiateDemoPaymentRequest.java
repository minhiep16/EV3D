package com.evshare.dispute.dto;

import java.math.BigDecimal;

public record InitiateDemoPaymentRequest(
        BigDecimal amount,
        String note
) {}
