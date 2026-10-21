package com.evshare.fund.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record PersonalPaymentSubmitRequest(
        UUID expenseShareId,

        @NotNull(message = "Số tiền thanh toán không được để trống")
        @DecimalMin(value = "1000", message = "Số tiền thanh toán tối thiểu là 1.000 VND")
        BigDecimal amount,

        String paymentMethod,
        String paymentReference,
        String evidenceUrl,
        String note
) {}
