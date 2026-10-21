package com.evshare.fund.dto;

import jakarta.validation.constraints.NotNull;

public record PersonalPaymentVerifyRequest(
        @NotNull(message = "Trạng thái xác minh không được để trống")
        Boolean confirmed,

        String note
) {}
