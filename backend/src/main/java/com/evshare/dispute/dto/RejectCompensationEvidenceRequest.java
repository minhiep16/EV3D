package com.evshare.dispute.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectCompensationEvidenceRequest(
        @NotBlank(message = "Lý do từ chối không được để trống")
        String reason
) {}
