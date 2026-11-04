package com.evshare.onboarding.dto;

import com.evshare.onboarding.entity.GroupInvitation;
import com.evshare.onboarding.entity.InvitationStatus;

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
        Instant createdAt
) {
    public static GroupInvitationResponse fromEntity(GroupInvitation inv, String groupName, String inviterName) {
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
                inv.getCreatedAt()
        );
    }
}

