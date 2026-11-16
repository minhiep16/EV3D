package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeCategory;
import com.evshare.dispute.entity.DisputePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateDisputeRequest(
        @NotNull(message = "Phương tiện không được để trống")
        UUID vehicleId,

        @NotNull(message = "Loại khiếu nại không được để trống")
        DisputeCategory category,

        @NotBlank(message = "Tiêu đề khiếu nại không được để trống")
        @Size(max = 255, message = "Tiêu đề không quá 255 ký tự")
        String title,

        @NotBlank(message = "Mô tả chi tiết tranh chấp không được để trống")
        String description,

        DisputePriority priority,

        // Transaction References (Optional based on category)
        UUID bookingId,
        UUID tripId,
        UUID handoverId,
        UUID inspectionId,
        UUID damageRecordId,
        UUID expenseId,
        UUID expenseShareId,
        UUID personalPaymentId,
        UUID proposalId,
        UUID ownershipTransferId,

        BigDecimal disputedAmount,

        // Optional list of respondent/affected co-owner IDs
        List<UUID> respondentUserIds,

        // Optional initial evidence items
        List<InitialEvidenceItem> initialEvidences
) {
    public record InitialEvidenceItem(
            String title,
            String fileUrl,
            String fileType,
            Long fileSizeBytes,
            String integrityHash
    ) {}
}

