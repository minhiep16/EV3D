package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateInvitationRequest(
        UUID inviteeUserId,
        String inviteeEmail,
        BigDecimal leaderTransferPercentage,
        BigDecimal proposedPercentage,
        List<ContributorShareContributionDto> additionalContributions,
        String invitationNote
) {
}
