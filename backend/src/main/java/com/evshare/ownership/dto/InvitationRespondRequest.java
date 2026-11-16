package com.evshare.ownership.dto;

import jakarta.validation.constraints.NotNull;

public record InvitationRespondRequest(
        @NotNull(message = "Lựa chọn chấp nhận hoặc từ chối không được để trống")
        Boolean accept,
        String reason
) {
}
