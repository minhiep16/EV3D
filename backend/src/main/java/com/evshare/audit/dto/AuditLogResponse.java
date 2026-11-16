package com.evshare.audit.dto;

import com.evshare.audit.entity.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String actorEmail,
        String actorRole,
        String action,
        String resourceType,
        String resourceId,
        String previousState,
        String newState,
        String description,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogResponse fromEntity(AuditLog entity) {
        if (entity == null) return null;
        return new AuditLogResponse(
                entity.getId(),
                entity.getActorId(),
                entity.getActorName(),
                entity.getActorEmail(),
                entity.getActorRole(),
                entity.getAction(),
                entity.getResourceType(),
                entity.getResourceId(),
                entity.getPreviousState(),
                entity.getNewState(),
                entity.getDescription(),
                entity.getIpAddress(),
                entity.getCreatedAt()
        );
    }
}
