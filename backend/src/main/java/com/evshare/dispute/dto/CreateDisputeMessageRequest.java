package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeMessageVisibility;
import jakarta.validation.constraints.NotBlank;

public record CreateDisputeMessageRequest(
        @NotBlank(message = "Nội dung phản hồi không được để trống")
        String content,

        DisputeMessageVisibility visibility
) {}

