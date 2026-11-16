package com.evshare.admin.dto;

import com.evshare.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Trạng thái người dùng không được để trống")
        UserStatus status,
        String reason
) {
}
