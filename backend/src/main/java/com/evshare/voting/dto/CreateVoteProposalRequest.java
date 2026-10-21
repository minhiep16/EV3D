package com.evshare.voting.dto;

import com.evshare.voting.entity.VoteProposalType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateVoteProposalRequest(
        @NotNull(message = "ID phương tiện là bắt buộc.")
        UUID vehicleId,

        @NotNull(message = "Loại đề xuất là bắt buộc.")
        VoteProposalType proposalType,

        @NotBlank(message = "Tiêu đề đề xuất không được để trống.")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự.")
        String title,

        String description,

        @NotNull(message = "Chi phí dự kiến là bắt buộc.")
        @DecimalMin(value = "1000.00", message = "Chi phí dự kiến tối thiểu là 1.000 VNĐ.")
        BigDecimal estimatedAmount,

        Instant votingEndsAt,

        Integer votingDurationDays,

        UUID relatedMaintenanceRequestId
) {}
