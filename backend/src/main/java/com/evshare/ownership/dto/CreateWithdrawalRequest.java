package com.evshare.ownership.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWithdrawalRequest(
        @NotBlank(message = "Vui lòng nhập lý do rút khỏi nhóm")
        String reason
) {
}
