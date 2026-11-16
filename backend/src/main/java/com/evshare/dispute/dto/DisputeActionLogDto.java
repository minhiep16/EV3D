package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeActionLog;
import com.evshare.dispute.entity.DisputeStatus;

import java.time.Instant;
import java.util.UUID;

public record DisputeActionLogDto(
        UUID id,
        UUID disputeId,
        UUID actorId,
        String actorName,
        String actorRole,
        String actionType,
        DisputeStatus previousStatus,
        DisputeStatus newStatus,
        String reason,
        String details,
        Instant createdAt
) {
    public static DisputeActionLogDto fromEntity(DisputeActionLog log) {
        if (log == null) return null;
        return new DisputeActionLogDto(
                log.getId(),
                log.getDispute() != null ? log.getDispute().getId() : null,
                log.getActor() != null ? log.getActor().getId() : null,
                log.getActorName(),
                log.getActorRole(),
                log.getActionType(),
                log.getPreviousStatus(),
                log.getNewStatus(),
                log.getReason(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}
