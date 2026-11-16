package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InvitationPermissionResponse(
        boolean canInvite,
        UUID currentLeaderUserId,
        String currentLeaderName,
        BigDecimal leaderSharePercentage,
        BigDecimal maxTransferablePercentage,
        BigDecimal minTransferPercentage,
        String message
) {
}
