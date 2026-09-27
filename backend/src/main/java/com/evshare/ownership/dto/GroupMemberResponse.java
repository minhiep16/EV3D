package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.MemberStatus;

import java.time.Instant;
import java.util.UUID;

public record GroupMemberResponse(
        UUID id,
        UUID groupId,
        UUID userId,
        String fullName,
        String email,
        String role,
        GroupMemberRole memberRole,
        MemberStatus status,
        Instant joinedAt,
        Instant removedAt,
        OwnershipShareResponse share
) {
    public GroupMemberResponse(
            UUID id,
            UUID groupId,
            UUID userId,
            String fullName,
            String email,
            String role,
            GroupMemberRole memberRole,
            MemberStatus status,
            Instant joinedAt,
            OwnershipShareResponse share
    ) {
        this(id, groupId, userId, fullName, email, role, memberRole, status, joinedAt, null, share);
    }
}
