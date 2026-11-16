package com.evshare.dispute.dto;

import jakarta.validation.constraints.NotNull;

public record RespondToResolutionRequest(
        @NotNull(message = "Quyết định đồng thuận hay từ chối không được để trống")
        Boolean accept,

        String note
) {}

