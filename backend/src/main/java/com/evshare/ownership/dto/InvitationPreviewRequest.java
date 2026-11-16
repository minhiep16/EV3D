package com.evshare.ownership.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record InvitationPreviewRequest(
        UUID inviteeUserId,
        String inviteeEmail,

        @NotNull(message = "Tỷ lệ chuyển nhượng từ Trưởng nhóm là bắt buộc")
        @DecimalMin(value = "10.00", message = "Trưởng nhóm bắt buộc chuyển nhượng tối thiểu 10.00% tỷ lệ sở hữu")
        BigDecimal leaderTransferPercentage,

        List<ContributorShareContributionDto> additionalContributions
) {
}
