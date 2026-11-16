package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record InvitationPreviewResponse(
        UUID groupId,
        String groupName,
        UUID vehicleId,
        String vehicleName,
        UUID inviteeUserId,
        String inviteeName,
        String inviteeEmail,
        BigDecimal leaderTransferPercentage,
        BigDecimal totalOfferedPercentage,
        List<MemberSharePreviewDto> currentDistribution,
        List<MemberSharePreviewDto> projectedDistribution,
        UUID currentLeaderId,
        String currentLeaderName,
        UUID projectedLeaderId,
        String projectedLeaderName,
        boolean leaderChanges,
        String initialStatus,
        String note
) {
}
