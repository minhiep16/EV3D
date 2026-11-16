package com.evshare.audit.service;

import com.evshare.audit.dto.AuditLogResponse;
import com.evshare.audit.entity.AuditLog;
import com.evshare.audit.repository.AuditLogRepository;
import com.evshare.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public AuditLog recordLog(
            User actor,
            String action,
            String resourceType,
            String resourceId,
            String previousState,
            String newState,
            String description,
            String ipAddress
    ) {
        UUID actorId = actor != null ? actor.getId() : null;
        String actorName = actor != null ? actor.getFullName() : "HỆ THỐNG";
        String actorEmail = actor != null ? actor.getEmail() : "system@evshare.internal";
        String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : "SYSTEM";

        return recordLog(actorId, actorName, actorEmail, actorRole, action, resourceType, resourceId, previousState, newState, description, ipAddress);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public AuditLog recordLog(
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
            String ipAddress
    ) {
        try {
            AuditLog auditLog = new AuditLog(
                    UUID.randomUUID(),
                    actorId,
                    actorName,
                    actorEmail,
                    actorRole,
                    action,
                    resourceType,
                    resourceId,
                    previousState,
                    newState,
                    description,
                    ipAddress
            );
            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("[AUDIT] Action: {}, Resource: {}/{}, Actor: {} ({})", action, resourceType, resourceId, actorName, actorRole);
            return saved;
        } catch (Exception ex) {
            log.warn("[AUDIT] Failed to persist audit log: {}", ex.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(
            String action,
            String resourceType,
            String actorRole,
            Instant fromTime,
            Instant toTime,
            String search,
            Pageable pageable
    ) {
        return auditLogRepository.findWithFilters(action, resourceType, actorRole, fromTime, toTime, search, pageable)
                .map(AuditLogResponse::fromEntity);
    }
}
