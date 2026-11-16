package com.evshare.dispute.dto;

import jakarta.validation.constraints.NotBlank;

public record ExecuteCorrectiveActionRequest(
        @NotBlank(message = "Chi tiết khắc phục / thực thi không được để trống")
        String correctiveActionSummary,

        String note
) {}

