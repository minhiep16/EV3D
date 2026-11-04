package com.evshare.onboarding.dto;

import jakarta.validation.constraints.NotBlank;

public record RedeemInviteCodeRequest(
        @NotBlank(message = "Mã mời không được để trống")
        String inviteCode
) {}

