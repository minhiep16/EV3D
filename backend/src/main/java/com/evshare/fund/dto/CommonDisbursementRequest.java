package com.evshare.fund.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record CommonDisbursementRequest(
        @NotNull(message = "Mã khoản chi không được để trống")
        UUID expenseId,

        BigDecimal amount,
        String note
) {}
