package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeParticipant;
import com.evshare.dispute.entity.DisputeParticipantRole;

import java.time.Instant;
import java.util.UUID;

public record DisputeParticipantDto(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        DisputeParticipantRole role,
        String roleVi,
        Boolean hasAcceptedResolution,
        Instant respondedAt,
        Instant createdAt
) {
    public static DisputeParticipantDto fromEntity(DisputeParticipant participant) {
        if (participant == null) return null;
        return new DisputeParticipantDto(
                participant.getId(),
                participant.getUser() != null ? participant.getUser().getId() : null,
                participant.getUser() != null ? participant.getUser().getFullName() : null,
                participant.getUser() != null ? participant.getUser().getEmail() : null,
                participant.getRole(),
                participant.getRole() != null ? participant.getRole().getVietnameseLabel() : null,
                participant.getHasAcceptedResolution(),
                participant.getRespondedAt(),
                participant.getCreatedAt()
        );
    }
}

