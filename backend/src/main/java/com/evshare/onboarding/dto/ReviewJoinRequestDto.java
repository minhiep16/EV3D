package com.evshare.onboarding.dto;

import jakarta.validation.constraints.NotNull;

public record ReviewJoinRequestDto(
        @NotNull(message = "Kết quả xét duyệt không được để trống")
        boolean approve,

        String reviewNotes
) {}

