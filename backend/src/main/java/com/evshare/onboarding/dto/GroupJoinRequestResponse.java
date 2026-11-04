package com.evshare.onboarding.dto;

import com.evshare.onboarding.entity.GroupJoinRequest;
import com.evshare.onboarding.entity.JoinRequestStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GroupJoinRequestResponse(
        UUID id,
        UUID groupId,
        String groupName,
        UUID userId,
        String userName,
        String userEmail,
        BigDecimal requestedPercentage,
        String message,
        JoinRequestStatus status,
        String reviewNotes,
        UUID reviewedBy,
        Instant reviewedAt,
        Instant createdAt
) {
    public static GroupJoinRequestResponse fromEntity(GroupJoinRequest req, String groupName, String userName, String userEmail) {
        if (req == null) return null;
        return new GroupJoinRequestResponse(
                req.getId(),
                req.getGroupId(),
                groupName,
                req.getUserId(),
                userName,
                userEmail,
                req.getRequestedPercentage(),
                req.getMessage(),
                req.getStatus(),
                req.getReviewNotes(),
                req.getReviewedBy(),
                req.getReviewedAt(),
                req.getCreatedAt()
        );
    }
}

