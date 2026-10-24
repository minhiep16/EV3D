package com.evshare.ownership.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateInvitationRequest(
        @NotBlank(message = "Vui lòng nhập địa chỉ email của người được mời")
        @Email(message = "Email không hợp lệ")
        String inviteeEmail,

        BigDecimal proposedPercentage,

        String invitationNote
) {
}
