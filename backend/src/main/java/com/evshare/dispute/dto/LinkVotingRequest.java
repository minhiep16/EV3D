package com.evshare.dispute.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LinkVotingRequest(
        @NotNull(message = "Mã biểu quyết không được để trống")
        UUID proposalId
) {}

