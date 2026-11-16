package com.evshare.dispute.dto;

import com.evshare.dispute.entity.DisputeMessage;
import com.evshare.dispute.entity.DisputeMessageVisibility;

import java.time.Instant;
import java.util.UUID;

public record DisputeMessageDto(
        UUID id,
        UUID senderId,
        String senderName,
        String senderRole,
        DisputeMessageVisibility visibility,
        String content,
        Instant createdAt
) {
    public static DisputeMessageDto fromEntity(DisputeMessage msg) {
        if (msg == null) return null;
        return new DisputeMessageDto(
                msg.getId(),
                msg.getSender() != null ? msg.getSender().getId() : null,
                msg.getSender() != null ? msg.getSender().getFullName() : null,
                msg.getSender() != null && msg.getSender().getRole() != null ? msg.getSender().getRole().name() : null,
                msg.getVisibility(),
                msg.getContent(),
                msg.getCreatedAt()
        );
    }
}

