package com.evshare.onboarding.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateInvitationRequest(
        @NotBlank(message = "Email người nhận không được để trống")
        String inviteeEmail,

        UUID inviteeUserId,

        @NotNull(message = "Tỷ lệ sở hữu đề xuất không được để trống")
        @DecimalMin(value = "0.01", message = "Tỷ lệ sở hữu tối thiểu là 0.01%")
        BigDecimal proposedPercentage
) {}

