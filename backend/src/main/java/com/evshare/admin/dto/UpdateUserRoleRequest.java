package com.evshare.admin.dto;

import com.evshare.user.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Vai trò người dùng không được để trống")
        Role role,
        String reason
) {
}
