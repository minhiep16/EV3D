package com.evshare.ownership.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AssignShareRequest(
        @NotNull(message = "Member ID không được để trống")
        UUID memberId,

        @NotNull(message = "Tỷ lệ sở hữu không được để trống")
        @DecimalMin(value = "0.01", message = "Tỷ lệ sở hữu phải lớn hơn 0%")
        @DecimalMax(value = "100.00", message = "Tỷ lệ sở hữu không được vượt quá 100%")
        BigDecimal percentage
) {}
