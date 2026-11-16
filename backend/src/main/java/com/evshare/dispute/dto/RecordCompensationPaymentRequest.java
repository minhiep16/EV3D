package com.evshare.dispute.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record RecordCompensationPaymentRequest(
        @NotNull(message = "Số tiền thanh toán không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền thanh toán phải lớn hơn 0")
        BigDecimal amount,

        @NotBlank(message = "Mã tham chiếu thanh toán không được để trống")
        String paymentReference,

        String receiptUrl,

        Instant paymentDate,

        String note
) {}
