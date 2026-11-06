package com.evshare.onboarding.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InvitationContractReviewResponse(
        UUID invitationId,
        UUID groupId,
        String groupName,
        UUID vehicleId,
        String vehicleName,
        String vehicleModel,
        String vehiclePlateNumber,
        BigDecimal vehicleValue,
        UUID inviterId,
        String inviterName,
        String inviteeEmail,
        String inviteeName,
        BigDecimal proposedPercentage,
        BigDecimal proposedContributionAmount,
        UUID contractId,
        String contractCode,
        UUID versionId,
        Integer versionNumber,
        String versionNumberFormatted,
        String title,
        String contentSnapshot,
        String contentHash,
        String votingRule,
        BigDecimal quorumPercentage,
        BigDecimal approvalThresholdPercentage,
        boolean alreadyConsented,
        Instant consentedAt,
        String signerFullName
) {}

