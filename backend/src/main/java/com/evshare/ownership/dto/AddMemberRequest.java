package com.evshare.ownership.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddMemberRequest(
        @NotNull(message = "User ID không được để trống")
        UUID userId
) {}
