package com.evshare.onboarding.dto;

import com.evshare.onboarding.entity.GroupInvitation;
import com.evshare.onboarding.entity.InvitationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GroupInvitationResponse(
        UUID id,
        UUID groupId,
        String groupName,
        UUID inviterId,
        String inviterName,
        String inviteeEmail,
        UUID inviteeUserId,
        BigDecimal proposedPercentage,
        String inviteCode,
        InvitationStatus status,
        Instant expiresAt,
        Instant createdAt,
        String vehicleModel,
        String vehiclePlateNumber,
        BigDecimal proposedContributionAmount,
        UUID contractId,
        UUID contractVersionId,
        String contentHash,
        Instant consentedAt,
        String signerFullName
) {
    /**
     * Backward-compatible alias for frontend clients expecting intendedSharePercentage
     */
    @JsonProperty("intendedSharePercentage")
    public BigDecimal intendedSharePercentage() {
        return proposedPercentage;
    }

    public static GroupInvitationResponse fromEntity(GroupInvitation inv, String groupName, String inviterName) {
        return fromEntity(inv, groupName, inviterName, null, null, null, null, null, null);
    }

    public static GroupInvitationResponse fromEntity(
            GroupInvitation inv,
            String groupName,
            String inviterName,
            String vehicleModel,
            String vehiclePlateNumber,
            BigDecimal proposedContributionAmount,
            UUID contractId,
            UUID contractVersionId,
            String contentHash
    ) {
        if (inv == null) return null;
        return new GroupInvitationResponse(
                inv.getId(),
                inv.getGroupId(),
                groupName,
                inv.getInviterId(),
                inviterName,
                inv.getInviteeEmail(),
                inv.getInviteeUserId(),
                inv.getProposedPercentage(),
                inv.getInviteCode(),
                inv.getStatus(),
                inv.getExpiresAt(),
                inv.getCreatedAt(),
                vehicleModel,
                vehiclePlateNumber,
                proposedContributionAmount,
                contractId,
                inv.getContractVersionId() != null ? inv.getContractVersionId() : contractVersionId,
                inv.getConsentContentHash() != null ? inv.getConsentContentHash() : contentHash,
                inv.getConsentedAt(),
                inv.getSignerFullName()
        );
    }
}

