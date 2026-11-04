package com.evshare.onboarding.dto;

import java.math.BigDecimal;

public record CreateJoinRequestDto(
        BigDecimal requestedPercentage,
        String message
) {}

