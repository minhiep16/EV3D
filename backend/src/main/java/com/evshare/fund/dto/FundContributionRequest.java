package com.evshare.fund.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FundContributionRequest(
        @NotNull(message = "Số tiền đóng góp không được để trống")
        @DecimalMin(value = "1000", message = "Số tiền đóng góp tối thiểu là 1.000 VND")
        BigDecimal amount,

        String paymentMethod,
        String paymentReference,
        String evidenceUrl,
        String note
) {}
