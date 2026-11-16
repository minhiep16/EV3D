package com.evshare.ownership.dto;

import jakarta.validation.constraints.NotNull;

public record InvitationConsentActionRequest(
        @NotNull(message = "Lựa chọn phê duyệt không được để trống")
        Boolean approved,
        String note
) {
}
