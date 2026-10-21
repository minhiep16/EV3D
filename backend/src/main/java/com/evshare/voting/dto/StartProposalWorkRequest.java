package com.evshare.voting.dto;

import jakarta.validation.constraints.Size;

public record StartProposalWorkRequest(
        @Size(max = 500, message = "Ghi chú bắt đầu không vượt quá 500 ký tự.")
        String note
) {}
